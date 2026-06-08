export type ReferralCodeRow = {
  id: string;
  code: string;
  name?: string | null;
  referrer_email?: string | null;
  referrer_contact?: string | null;
  referrer_designation?: string | null;
  reward_amount?: number | null;
  max_uses?: number | null;
  use_count: number;
  is_active: boolean;
  expires_at?: string | null;
  created_by_admin_id: string;
  created_by_name?: string | null;
  created_at?: string | null;
};

export type ReferralCodeVerifyReason =
  | "not_found"
  | "expired"
  | "inactive"
  | "limit_reached"
  | "invalid_format";

export type ReferralCodeVerifyResponse = {
  valid: boolean;
  code?: string | null;
  name?: string | null;
  reason?: ReferralCodeVerifyReason | null;
};

export type PaginatedReferralCodes = {
  items: ReferralCodeRow[];
  total: number;
  page: number;
  page_size: number;
};
