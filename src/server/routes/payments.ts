import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { requireAdmin, requireUser } from "../middlewares/auth";
import { isAdmin } from "../lib/session";
import {
  db,
  membersTable,
  membershipTiersTable,
  paymentsTable,
  type Payment,
} from "@workspace/db";
import {
  initializePaystackTransaction,
  isValidPaystackSignature,
  paystackConfigured,
  paystackPublicKey,
  verifyPaystackTransaction,
} from "../lib/paystack";
import {
  daysUntil,
  deriveMemberStatus,
  fulfillPayment,
} from "../lib/membership";

const router: IRouter = Router();

const MIN_DONATION_NGN = 100;
const MAX_DONATION_NGN = 5_000_000;

function serializePayment(payment: Payment) {
  return {
    id: payment.id,
    reference: payment.reference,
    purpose: payment.purpose,
    status: payment.status,
    amountKobo: payment.amountKobo,
    amountNgn: payment.amountKobo / 100,
    currency: payment.currency,
    email: payment.email,
    channel: payment.channel,
    tierId: payment.tierId,
    memberId: payment.memberId,
    paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
    createdAt: payment.createdAt.toISOString(),
  };
}

function resolveAppOrigin(req: {
  headers: Record<string, unknown>;
  protocol?: string;
}): string {
  const configured = (process.env.APP_ORIGIN ?? "").trim();
  if (configured) return configured.replace(/\/$/, "");
  const referer = req.headers.referer;
  if (typeof referer === "string" && referer) {
    try {
      return new URL(referer).origin;
    } catch {
      /* ignore malformed referer */
    }
  }
  const origin = req.headers.origin;
  if (typeof origin === "string" && origin) return origin.replace(/\/$/, "");
  const host = String(req.headers.host ?? "localhost:5000");
  const proto = req.protocol === "https" ? "https" : "http";
  return `${proto}://${host}`;
}

async function billingForUser(userId: string) {
  const [member] = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.userId, userId));
  if (!member) return null;

  const [tier] = await db
    .select()
    .from(membershipTiersTable)
    .where(eq(membershipTiersTable.id, member.tierId));
  const rows = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.memberId, member.id))
    .orderBy(paymentsTable.createdAt);

  return {
    member: {
      id: member.id,
      status: member.status,
      tierId: member.tierId,
      displayName: member.displayName,
    },
    tier: tier
      ? {
          id: tier.id,
          nameEn: tier.nameEn,
          nameIg: tier.nameIg,
          priceNgn: tier.priceNgn,
          interval: tier.interval,
        }
      : null,
    status: deriveMemberStatus(member, tier ?? null),
    membershipStartedAt: member.membershipStartedAt
      ? member.membershipStartedAt.toISOString()
      : null,
    renewsAt: member.renewsAt ? member.renewsAt.toISOString() : null,
    daysRemaining: daysUntil(member.renewsAt),
    totalPaidKobo: member.totalPaidKobo,
    totalPaidNgn: member.totalPaidKobo / 100,
    payments: rows.map(serializePayment).reverse(),
  };
}

router.get("/payments/config", (_req, res): void => {
  const enabled = paystackConfigured();
  res.json({
    enabled,
    publicKey: enabled ? paystackPublicKey() || null : null,
    currency: "NGN",
  });
});

router.post("/payments/initialize", requireUser, async (req, res): Promise<void> => {
  const user = req.user!;
  if (!paystackConfigured()) {
    res.status(503).json({ error: "Online payment is not configured yet." });
    return;
  }
  if (!user.email) {
    res.status(400).json({ error: "Add an email address to your account before paying." });
    return;
  }

  const body = (req.body ?? {}) as {
    purpose?: unknown;
    tierId?: unknown;
    amountNgn?: unknown;
  };
  const purpose =
    body.purpose === "membership"
      ? "membership"
      : body.purpose === "donation"
        ? "donation"
        : null;
  if (!purpose) {
    res.status(400).json({ error: "`purpose` must be `membership` or `donation`." });
    return;
  }

  let amountKobo = 0;
  let tierId: string | null = null;
  let memberId: string | null = null;
  let label = "Donation";

  if (purpose === "membership") {
    const tierValue = typeof req.body?.tierId === "string" ? (req.body.tierId as string) : "";
    const [member] = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.userId, req.user!.id));
    if (!member) {
      res.status(409).json({ error: "Register for membership before paying for a tier." });
      return;
    }
    const [tier] = await db
      .select()
      .from(membershipTiersTable)
      .where(eq(membershipTiersTable.id, tierValue));
    if (!tier || !tier.active || tier.priceNgn <= 0 || tier.interval === "free") {
      res.status(400).json({ error: "Choose a payable membership tier." });
      return;
    }
    amountKobo = tier.priceNgn * 100;
    tierId = tier.id;
    memberId = member.id;
    label = tier.nameEn;
  } else {
    const amountNgn = Number(req.body?.amountNgn);
    if (
      !Number.isInteger(amountNgn) ||
      amountNgn < MIN_DONATION_NGN ||
      amountNgn > MAX_DONATION_NGN
    ) {
      res.status(400).json({
        error: `Enter a donation between ₦${MIN_DONATION_NGN} and ₦${MAX_DONATION_NGN.toLocaleString()}.`,
      });
      return;
    }
    amountKobo = amountNgn * 100;
  }

  const reference = `IWUG-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8)}`;
  const callbackUrl = `${resolveAppOrigin(req)}/${purpose === "membership" ? "member" : "donate"}`;

  const [payment] = await db
    .insert(paymentsTable)
    .values({
      id: randomUUID(),
      reference,
      purpose,
      userId: user.id,
      memberId,
      tierId,
      amountKobo,
      email: user.email,
      status: "pending",
      metadata: { label },
    })
    .returning();

  try {
    const initialized = await initializePaystackTransaction({
      email: user.email,
      amountKobo,
      reference,
      callbackUrl,
      metadata: { purpose, tierId, memberId },
    });
    await db
      .update(paymentsTable)
      .set({ metadata: { label, accessCode: initialized.accessCode } })
      .where(eq(paymentsTable.id, payment.id));
    res.status(201).json({
      reference,
      authorizationUrl: initialized.authorizationUrl,
      amountKobo,
      amountNgn: amountKobo / 100,
    });
  } catch (error) {
    await db
      .update(paymentsTable)
      .set({ status: "failed" })
      .where(eq(paymentsTable.id, payment.id));
    const message = error instanceof Error ? error.message : "Could not start checkout.";
    res.status(502).json({ error: message });
  }
});

router.get("/payments/verify/:reference", requireUser, async (req, res): Promise<void> => {
  const reference = String(req.params.reference ?? "");
  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.reference, reference));
  if (!payment) {
    res.status(404).json({ error: "Payment not found." });
    return;
  }
  if (payment.userId && payment.userId !== req.user!.id && !isAdmin(req.user!)) {
    res.status(403).json({ error: "This payment belongs to another account." });
    return;
  }

  let current = payment;
  if (current.status !== "success") {
    if (!paystackConfigured()) {
      res.status(503).json({ error: "Online payment is not configured yet." });
      return;
    }
    const verified = await verifyPaystackTransaction(reference).catch(() => null);
    if (!verified) {
      res.status(502).json({ error: "Could not reach the payment provider." });
      return;
    }
    if (verified.success) {
      current = (await fulfillPayment(reference, verified)).payment;
    } else {
      const [updated] = await db
        .update(paymentsTable)
        .set({
          status: verified.status === "abandoned" ? "abandoned" : "failed",
          channel: verified.channel,
          amountKobo: verified.amountKobo || current.amountKobo,
        })
        .where(eq(paymentsTable.id, current.id))
        .returning();
      current = updated ?? current;
    }
  }

  res.json({
    payment: serializePayment(current),
    billing: current.purpose === "membership" ? await billingForUser(req.user!.id) : null,
  });
});

router.get("/member/billing", requireUser, async (req, res): Promise<void> => {
  const billing = await billingForUser(req.user!.id);
  if (!billing) {
    res.status(404).json({ error: "You do not have a membership profile yet." });
    return;
  }
  res.json(billing);
});

router.get("/admin/payments", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(paymentsTable)
    .orderBy(desc(paymentsTable.createdAt))
    .limit(500);

  let membershipKobo = 0;
  let donationKobo = 0;
  let pendingKobo = 0;
  let successCount = 0;
  for (const row of rows) {
    if (row.status === "success") {
      successCount += 1;
      if (row.purpose === "membership") membershipKobo += row.amountKobo;
      else donationKobo += row.amountKobo;
    } else if (row.status === "pending") {
      pendingKobo += row.amountKobo;
    }
  }

  res.json({
    totals: {
      membershipKobo,
      membershipNgn: membershipKobo / 100,
      donationKobo,
      donationNgn: donationKobo / 100,
      pendingKobo,
      pendingNgn: pendingKobo / 100,
      successCount,
      totalCount: rows.length,
    },
    payments: rows.map(serializePayment),
  });
});

router.post("/payments/webhook", async (req, res): Promise<void> => {
  const rawBody = (req as { rawBody?: Buffer }).rawBody;
  const signature = req.header("x-paystack-signature") ?? undefined;
  if (!isValidPaystackSignature(rawBody, signature)) {
    res.status(401).json({ error: "Invalid signature." });
    return;
  }
  const event = (req.body ?? {}) as {
    event?: string;
    data?: { reference?: string; amount?: number; channel?: string; paid_at?: string };
  };
  if (event.event === "charge.success" && event.data?.reference) {
    await fulfillPayment(String(event.data.reference), {
      amountKobo: Number(event.data.amount ?? 0),
      channel: event.data.channel ?? null,
      paidAt: event.data.paid_at ?? null,
    }).catch(() => undefined);
  }
  res.status(200).json({ received: true });
});

export default router;
