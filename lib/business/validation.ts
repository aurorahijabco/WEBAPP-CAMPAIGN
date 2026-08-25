import { z } from "zod";

// Shared server-side validation schemas used by Server Actions. Keep business
// rules here (single source of truth on the app layer, mirrored by DB
// constraints + RLS as defense in depth).

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username minimal 3 karakter")
  .max(30)
  .regex(/^[a-z0-9_]+$/, "Username hanya boleh huruf kecil, angka, underscore");

export const registerSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(100),
  username: usernameSchema,
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{9,15}$/, "Nomor WhatsApp tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  agreedSk: z.literal(true, { errorMap: () => ({ message: "Wajib menyetujui Syarat & Ketentuan" }) }),
});

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const newClaimSchema = z.object({
  branchId: z.string().uuid("Pilih cabang yang valid"),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        qty: z.coerce.number().int().positive(),
        price: z.coerce.number().nonnegative(),
      })
    )
    .min(1, "Minimal 1 item"),
});

export const contentSubmissionSchema = z.object({
  claimId: z.string().uuid(),
  type: z.enum(["story", "feed_photo", "feed_reels"]),
  platform: z.enum(["instagram", "tiktok"]),
  url: z
    .string()
    .trim()
    .url("URL tidak valid")
    .refine((v) => v.startsWith("http://") || v.startsWith("https://"), {
      message: "URL harus diawali http:// atau https://",
    }),
});

export const contentReviewSchema = z.object({
  submissionId: z.string().uuid(),
  status: z.enum(["APPROVED", "REJECTED", "HOLD"]),
  reason: z.string().trim().max(500).optional(),
});

export const billReviewSchema = z.object({
  billId: z.string().uuid(),
  status: z.enum(["VALID", "INVALID"]),
  note: z.string().trim().max(500).optional(),
});

export const redeemSchema = z.object({
  code: z.string().trim().min(4, "Kode voucher tidak valid"),
  productName: z.string().trim().min(1, "Pilih produk Series Sarimbit"),
});

export const createAgentSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(100),
  username: usernameSchema,
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{9,15}$/, "Nomor WhatsApp tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  branchId: z.string().uuid("Pilih cabang yang valid"),
});

export const updateAgentSchema = z.object({
  agentId: z.string().uuid(),
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(100),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{9,15}$/, "Nomor WhatsApp tidak valid"),
  branchId: z.string().uuid("Pilih cabang yang valid"),
  password: z.union([z.string().min(8, "Password minimal 8 karakter"), z.literal("")]).optional(),
});

export const deleteAgentSchema = z.object({
  agentId: z.string().uuid(),
});

const branchCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(2, "Kode cabang minimal 2 karakter")
  .max(30)
  .regex(/^[A-Z0-9_]+$/, "Kode cabang hanya boleh huruf besar, angka, underscore");

export const createBranchSchema = z.object({
  name: z.string().trim().min(3, "Nama cabang minimal 3 karakter").max(150),
  code: branchCodeSchema,
  address: z.string().trim().max(300).optional().or(z.literal("")),
});

export const updateBranchSchema = z.object({
  branchId: z.string().uuid(),
  name: z.string().trim().min(3, "Nama cabang minimal 3 karakter").max(150),
  code: branchCodeSchema,
  address: z.string().trim().max(300).optional().or(z.literal("")),
});

export const deleteBranchSchema = z.object({
  branchId: z.string().uuid(),
});
