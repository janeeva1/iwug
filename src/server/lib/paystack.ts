import { createHmac, timingSafeEqual } from "node:crypto";

const PAYSTACK_API = "https://api.paystack.co";

export interface PaystackInitialized {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface PaystackVerified {
  status: string;
  success: boolean;
  amountKobo: number;
  currency: string;
  channel: string | null;
  paidAt: string | null;
  email: string | null;
  metadata: Record<string, unknown> | null;
}

export function paystackSecret(): string {
  return (process.env.PAYSTACK_SECRET_KEY ?? "").trim();
}

export function paystackPublicKey(): string {
  return (process.env.PAYSTACK_PUBLIC_KEY ?? "").trim();
}

/** Whether live checkout and donations are available. */
export function paystackConfigured(): boolean {
  return paystackSecret().length > 0;
}

async function callPaystack(
  path: string,
  init?: RequestInit,
): Promise<Record<string, unknown>> {
  const secret = paystackSecret();
  if (!secret) throw new Error("Paystack is not configured.");
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | { status?: boolean; message?: string; data?: unknown }
    | null;
  if (!response.ok || !payload || payload.status === false) {
    const message = payload?.message ?? `Paystack request failed (${response.status}).`;
    throw new Error(message);
  }
  return (payload.data ?? {}) as Record<string, unknown>;
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitialized> {
  const data = await callPaystack("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      callback_url: input.callbackUrl,
      currency: "NGN",
      metadata: input.metadata ?? {},
    }),
  });
  const authorizationUrl = String(data.authorization_url ?? "");
  const accessCode = String(data.access_code ?? "");
  const reference = String(data.reference ?? input.reference);
  if (!authorizationUrl) throw new Error("Paystack did not return a checkout URL.");
  return { authorizationUrl, accessCode, reference };
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerified> {
  const data = await callPaystack(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  const customer = (data.customer ?? {}) as { email?: string };
  const status = String(data.status ?? "failed");
  return {
    status,
    success: status === "success",
    amountKobo: Number(data.amount ?? 0),
    currency: String(data.currency ?? "NGN"),
    channel: data.channel ? String(data.channel) : null,
    paidAt: data.paid_at ? String(data.paid_at) : null,
    email: customer.email ? String(customer.email) : null,
    metadata: (data.metadata as Record<string, unknown> | null) ?? null,
  };
}

/** Validates the `x-paystack-signature` header (HMAC-SHA512 of the raw body). */
export function isValidPaystackSignature(
  rawBody: Buffer | string | undefined,
  signature: string | undefined,
): boolean {
  const secret = paystackSecret();
  if (!secret || !rawBody || !signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
