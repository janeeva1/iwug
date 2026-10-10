import { eq } from "drizzle-orm";
import {
  db,
  membersTable,
  membershipTiersTable,
  paymentsTable,
  type Member,
  type MembershipTier,
  type Payment,
  type TierInterval,
} from "@workspace/db";

export type DerivedMemberStatus = "pending" | "active" | "paused" | "expired" | "free";

/** Adds one billing period to `from`, or `null` for non-renewing tiers. */
export function addBillingInterval(
  from: Date,
  interval: TierInterval,
): Date | null {
  const next = new Date(from.getTime());
  switch (interval) {
    case "annual":
      next.setFullYear(next.getFullYear() + 1);
      return next;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      return next;
    default:
      return null;
  }
}

/** Derives the effective membership state, including whether a paid tier lapsed. */
export function deriveMemberStatus(
  member: Pick<Member, "status" | "renewsAt">,
  tier: Pick<MembershipTier, "priceNgn" | "interval"> | null,
): DerivedMemberStatus {
  if (member.status === "pending") return "pending";
  if (member.status === "paused") return "paused";
  if (!tier || tier.priceNgn <= 0) return "active";
  if (tier.interval === "once") return "active";
  if (member.renewsAt && member.renewsAt.getTime() < Date.now()) return "expired";
  return "active";
}

export function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export interface FulfillResult {
  payment: Payment;
  member: Member | null;
}

/**
 * Marks a payment successful and, for memberships, activates or renews the
 * member. Idempotent: a payment already marked `success` is returned as-is.
 */
export async function fulfillPayment(
  reference: string,
  verified?: { amountKobo?: number; channel?: string | null; paidAt?: string | null },
): Promise<FulfillResult> {
  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.reference, reference))
    .limit(1);
  if (!payment) throw new Error(`Unknown payment reference: ${reference}`);

  if (payment.status === "success") {
    let member: Member | null = null;
    if (payment.memberId) {
      const [row] = await db
        .select()
        .from(membersTable)
        .where(eq(membersTable.id, payment.memberId));
      member = row ?? null;
    }
    return { payment, member };
  }

  const paidAt = verified?.paidAt ? new Date(verified.paidAt) : new Date();
  const amountKobo = verified?.amountKobo ?? payment.amountKobo;

  const [updatedPayment] = await db
    .update(paymentsTable)
    .set({
      status: "success",
      amountKobo,
      channel: verified?.channel ?? null,
      paidAt,
      updatedAt: new Date(),
    })
    .where(eq(paymentsTable.id, payment.id))
    .returning();

  let member: Member | null = null;
  if (payment.purpose === "membership" && payment.memberId && payment.tierId) {
    const [existing] = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, payment.memberId));
    const [tier] = await db
      .select()
      .from(membershipTiersTable)
      .where(eq(membershipTiersTable.id, payment.tierId));
    if (existing && tier) {
      const startedAt = existing.membershipStartedAt ?? new Date();
      const renewalBase =
        existing.renewsAt && existing.renewsAt.getTime() > Date.now()
          ? existing.renewsAt
          : new Date();
      const renewsAt = addBillingInterval(renewalBase, tier.interval);
      const [updatedMember] = await db
        .update(membersTable)
        .set({
          status: "active",
          membershipStartedAt: startedAt,
          renewsAt,
          lastPaymentReference: reference,
          totalPaidKobo: existing.totalPaidKobo + (verified?.amountKobo ?? payment.amountKobo),
        })
        .where(eq(membersTable.id, existing.id))
        .returning();
      return { payment: updatedPayment, member: updatedMember ?? existing };
    }
  }

  return { payment: updatedPayment, member: null };
}
