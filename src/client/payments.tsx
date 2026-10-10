import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export interface PaymentConfig {
  enabled: boolean;
  publicKey: string | null;
  currency: string;
}

export interface PaymentRecord {
  id: string;
  reference: string;
  purpose: "membership" | "donation";
  status: "pending" | "success" | "failed" | "abandoned";
  amountKobo: number;
  amountNgn: number;
  currency: string;
  email: string | null;
  channel: string | null;
  tierId: string | null;
  memberId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface BillingSummary {
  member: { id: string; status: string; tierId: string; displayName: string };
  tier: {
    id: string;
    nameEn: string;
    nameIg: string;
    priceNgn: number;
    interval: string;
  } | null;
  status: "pending" | "active" | "paused" | "expired" | "free";
  membershipStartedAt: string | null;
  renewsAt: string | null;
  daysRemaining: number | null;
  totalPaidKobo: number;
  totalPaidNgn: number;
  payments: PaymentRecord[];
}

export interface AdminPayments {
  totals: {
    membershipKobo: number;
    membershipNgn: number;
    donationKobo: number;
    donationNgn: number;
    pendingKobo: number;
    pendingNgn: number;
    successCount: number;
    totalCount: number;
  };
  payments: PaymentRecord[];
}

export const PAYMENT_CONFIG_QUERY_KEY = ["payments", "config"] as const;
export const MEMBER_BILLING_QUERY_KEY = ["member", "billing"] as const;
export const ADMIN_PAYMENTS_QUERY_KEY = ["admin", "payments"] as const;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}/api${path}`, {
    ...init,
    headers: init?.body
      ? { "content-type": "application/json", ...(init?.headers ?? {}) }
      : init?.headers,
  });
  const payload = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) throw new Error(payload?.error ?? `Request failed (HTTP ${res.status}).`);
  return payload as T;
}

export function fetchPaymentConfig(): Promise<PaymentConfig> {
  return request<PaymentConfig>("/payments/config");
}
export function fetchMemberBilling(): Promise<BillingSummary> {
  return request<BillingSummary>("/member/billing");
}
export function fetchAdminPayments(): Promise<AdminPayments> {
  return request<AdminPayments>("/admin/payments");
}
export function initializePayment(input: {
  purpose: "membership" | "donation";
  tierId?: string;
  amountNgn?: number;
}): Promise<{ reference: string; authorizationUrl: string; amountKobo: number; amountNgn: number }> {
  return request("/payments/initialize", { method: "POST", body: JSON.stringify(input) });
}
export function verifyPayment(
  reference: string,
): Promise<{ payment: PaymentRecord; billing: BillingSummary | null }> {
  return request(`/payments/verify/${encodeURIComponent(reference)}`);
}

export function usePaymentConfig() {
  return useQuery({
    queryKey: PAYMENT_CONFIG_QUERY_KEY,
    queryFn: fetchPaymentConfig,
    staleTime: 5 * 60_000,
  });
}
export function useMemberBilling(enabled = true) {
  return useQuery({
    queryKey: MEMBER_BILLING_QUERY_KEY,
    queryFn: fetchMemberBilling,
    enabled,
    retry: false,
  });
}
export function useInitializePayment() {
  return useMutation({ mutationFn: initializePayment });
}
export function useVerifyPayment() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: verifyPayment,
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: MEMBER_BILLING_QUERY_KEY });
    },
  });
}

export function formatNgn(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AdminPaymentsPanel() {
  const query = useQuery({ queryKey: ADMIN_PAYMENTS_QUERY_KEY, queryFn: fetchAdminPayments });

  if (query.isLoading) {
    return <p className="admin-private-note">Loading payments…</p>;
  }
  if (query.error) {
    return (
      <div className="admin-data-status">
        <span className="eyebrow">PAYMENTS</span>
        <p>{query.error instanceof Error ? query.error.message : "Could not load payments."}</p>
        <button className="btn-primary" onClick={() => void query.refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const totals = query.data?.totals;
  const payments = query.data?.payments ?? [];
  return (
    <div className="admin-payments" data-testid="admin-payments">
      <div className="payment-totals">
        <div className="payment-total">
          <span>Membership income</span>
          <strong data-testid="total-membership">{formatNgn(totals?.membershipNgn ?? 0)}</strong>
        </div>
        <div className="payment-total">
          <span>Donations</span>
          <strong data-testid="total-donations">{formatNgn(totals?.donationNgn ?? 0)}</strong>
        </div>
        <div className="payment-total">
          <span>Pending</span>
          <strong>{formatNgn(totals?.pendingNgn ?? 0)}</strong>
        </div>
        <div className="payment-total">
          <span>Settled</span>
          <strong>
            {totals?.successCount ?? 0}/{totals?.totalCount ?? 0}
          </strong>
        </div>
      </div>
      {payments.length === 0 ? (
        <p className="admin-private-note">No payments recorded yet.</p>
      ) : (
        <table className="payments-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Purpose</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Email</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td><code>{payment.reference}</code></td>
                <td>{payment.purpose}</td>
                <td>{formatNgn(payment.amountNgn)}</td>
                <td><span className={`payment-status status-${payment.status}`}>{payment.status}</span></td>
                <td>{payment.email ?? "—"}</td>
                <td>{new Date(payment.createdAt).toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
