// Domain types mirroring the Postgres schema (supabase/migrations/0001_init.sql).
// Keep this file in sync with the DB. For fully generated types, run:
//   npx supabase gen types typescript --project-id YOUR_REF > types/database.types.ts

export type AppRole = "customer" | "agent" | "admin";
export type BillStatus = "VALID" | "HOLD" | "INVALID";
export type ContentType = "story" | "feed_photo" | "feed_reels";
export type ContentPlatform = "instagram" | "tiktok";
export type ContentStatus = "PENDING" | "APPROVED" | "REJECTED" | "HOLD";
export type VoucherStatus = "RESERVED" | "ACTIVE" | "REDEEMED" | "EXPIRED";
export type CampaignPhase = "before" | "during" | "after";

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  role: AppRole;
  name: string;
  username: string;
  whatsapp: string;
  branch_id: string | null;
  agreed_sk_at: string | null;
  created_at: string;
}

export interface BillItem {
  name: string;
  qty: number;
  price: number;
}

export interface Bill {
  id: string;
  customer_id: string;
  branch_id: string;
  amount: number;
  items: BillItem[];
  photo_path: string;
  photo_hash: string | null;
  receipt_number: string | null;
  merchant_name: string | null;
  status: BillStatus;
  ocr_raw: Record<string, unknown> | null;
  note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Claim {
  id: string;
  customer_id: string;
  branch_id: string;
  bill_id: string;
  purchase_status: BillStatus;
  flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

export interface ContentSubmission {
  id: string;
  claim_id: string;
  type: ContentType;
  platform: ContentPlatform;
  url: string;
  status: ContentStatus;
  reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface Voucher {
  id: string;
  code: string;
  claim_id: string;
  customer_id: string;
  branch_id: string;
  value: number;
  status: VoucherStatus;
  created_at: string;
  redeemed_at: string | null;
  redeemed_amount: number | null;
  redeemed_by: string | null;
}

export interface AuditLog {
  id: string;
  created_at: string;
  user_id: string | null;
  username: string | null;
  role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  branch_id: string | null;
  branch_name: string | null;
  status: "success" | "failed";
  metadata: Record<string, unknown>;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  meta: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export const REWARD_TIER_LABELS: Record<ContentType, string> = {
  story: "Story Photo",
  feed_photo: "Feed Photo",
  feed_reels: "Feed Reels",
};

export const REJECT_REASON_PRESETS = [
  "Konten tidak menampilkan Series Agustin dengan jelas",
  "Tidak ada mention @aurorahijab.co",
  "Akun tidak dapat diakses untuk verifikasi",
  "Reels kurang dari 30 detik / effort tidak jelas",
  "Konten bukan orisinal (repost/reupload)",
  "Link tidak valid atau tidak dapat dibuka",
];
