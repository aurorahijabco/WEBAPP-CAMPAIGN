import "server-only";
import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { z } from "zod";

// Server-only Gemini Vision OCR for receipt claims. The API key never
// reaches the client — this module is only ever imported from Server
// Actions. Gemini's structured output is treated as untrusted: it is
// schema-validated here, and the CALLER (app/customer/actions.ts) still
// runs its own deterministic checks on the result rather than trusting
// Gemini's judgment (e.g. `is_receipt`) at face value for anything that
// gates money or duplicate-prevention.

const MODEL = "gemini-3.6-flash";

const receiptItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, nullable: true },
    qty: { type: Type.NUMBER, nullable: true },
    price: { type: Type.NUMBER, nullable: true },
  },
  required: ["name", "qty", "price"],
};

const receiptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    is_receipt: {
      type: Type.BOOLEAN,
      description: "true only if the image is clearly a purchase receipt/struk. false for anything else.",
    },
    merchant_name: { type: Type.STRING, nullable: true, description: "Store/merchant name exactly as printed, or null if not legible." },
    transaction_date: {
      type: Type.STRING,
      nullable: true,
      description: "Transaction date in ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss), or null if not legible.",
    },
    receipt_number: { type: Type.STRING, nullable: true, description: "Receipt/invoice/transaction number as printed, or null if absent/not legible." },
    subtotal: { type: Type.NUMBER, nullable: true },
    discount: { type: Type.NUMBER, nullable: true },
    tax: { type: Type.NUMBER, nullable: true },
    total: { type: Type.NUMBER, nullable: true, description: "The final total amount paid, or null if not legible." },
    items: { type: Type.ARRAY, items: receiptItemSchema, nullable: true },
    quality: {
      type: Type.STRING,
      enum: ["good", "blurry", "partial", "unreadable"],
      description: "Overall legibility of the receipt image.",
    },
    warnings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Short human-readable notes about anything uncertain, cropped, glared, or ambiguous.",
    },
  },
  required: [
    "is_receipt",
    "merchant_name",
    "transaction_date",
    "receipt_number",
    "subtotal",
    "discount",
    "tax",
    "total",
    "items",
    "quality",
    "warnings",
  ],
};

const SYSTEM_PROMPT = `You are an OCR extraction engine for Indonesian retail purchase receipts (struk belanja).

Rules — follow exactly:
1. Only extract values that are CLEARLY, CONFIDENTLY legible in the image. If a field is blurry, cropped, ambiguous, or absent, output null for that field. NEVER guess, estimate, or infer a value that is not visibly printed on the receipt.
2. Set "is_receipt" to false if the image is not a purchase receipt at all (e.g. a random photo, a screenshot, a product photo, a blank page, another document type). Do not force a receipt interpretation onto a non-receipt image.
3. Numbers (subtotal, discount, tax, total, item price/qty) must be plain numbers with no currency symbols, thousands separators, or letters (e.g. "Rp 150.000" -> 150000).
4. "transaction_date" must be ISO 8601 (YYYY-MM-DD, or YYYY-MM-DDTHH:mm:ss if a time is printed). If only a partial or ambiguous date is visible, output null instead of guessing the missing part.
5. Set "quality" to "unreadable" if the image is too dark, blurry, or low-resolution to extract any reliable data; "partial" if only part of the receipt is visible/legible; "blurry" if legible but with visible quality issues; "good" otherwise.
6. Populate "warnings" with short factual notes about anything uncertain (e.g. "total figure partially obscured by glare", "date field cropped out of frame"). Leave it as an empty array if there is nothing to flag.
7. Output ONLY the JSON object matching the given schema — no extra commentary.`;

export type ReceiptQuality = "good" | "blurry" | "partial" | "unreadable";

export interface ReceiptOcrItem {
  name: string | null;
  qty: number | null;
  price: number | null;
}

export interface ReceiptOcrResult {
  is_receipt: boolean;
  merchant_name: string | null;
  transaction_date: string | null;
  receipt_number: string | null;
  subtotal: number | null;
  discount: number | null;
  tax: number | null;
  total: number | null;
  items: ReceiptOcrItem[] | null;
  quality: ReceiptQuality;
  warnings: string[];
}

// Defensive parse of Gemini's JSON output — the API is configured to honor
// the schema above, but the response is still external input and is never
// trusted without validation.
const ocrResultSchema = z.object({
  is_receipt: z.boolean(),
  merchant_name: z.string().trim().min(1).nullable(),
  transaction_date: z.string().trim().min(1).nullable(),
  receipt_number: z.string().trim().min(1).nullable(),
  subtotal: z.number().finite().nullable(),
  discount: z.number().finite().nullable(),
  tax: z.number().finite().nullable(),
  total: z.number().finite().nullable(),
  items: z
    .array(
      z.object({
        name: z.string().nullable(),
        qty: z.number().finite().nullable(),
        price: z.number().finite().nullable(),
      })
    )
    .nullable(),
  quality: z.enum(["good", "blurry", "partial", "unreadable"]),
  warnings: z.array(z.string()),
});

let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

const GENERIC_RETRY_MESSAGE = "Gagal memverifikasi struk. Silakan coba lagi.";
const GENERIC_UNREADABLE_MESSAGE =
  "Struk tidak dapat diverifikasi secara otomatis. Silakan upload ulang foto struk yang lebih jelas dan tidak buram.";

export type OcrOutcome = { ok: true; data: ReceiptOcrResult } | { ok: false; error: string };

/**
 * Sends the receipt image to Gemini Vision and returns a schema-validated
 * structured result. Never throws — every failure mode (missing config,
 * network/API error, malformed/non-JSON response, schema mismatch) resolves
 * to `{ ok: false, error }` with a user-facing message asking for a re-upload,
 * per the "never leave the user on a stuck/blank state" requirement.
 */
export async function extractReceiptData(imageBytes: Buffer, mimeType: string): Promise<OcrOutcome> {
  let ai: GoogleGenAI;
  try {
    ai = getClient();
  } catch (err) {
    console.error("[ocr] Gemini client init failed:", err);
    return { ok: false, error: "Layanan verifikasi struk sedang tidak tersedia. Silakan coba lagi nanti." };
  }

  let responseText: string | undefined;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }, { inlineData: { data: imageBytes.toString("base64"), mimeType } }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
        temperature: 0,
        // A hung Gemini call must never leave the user stuck on a loading
        // screen indefinitely — fail fast and let the caller show a
        // retry-friendly error instead.
        httpOptions: { timeout: 25_000 },
      },
    });
    responseText = response.text;
  } catch (err) {
    console.error("[ocr] Gemini generateContent failed:", err);
    return { ok: false, error: GENERIC_RETRY_MESSAGE };
  }

  if (!responseText) {
    return { ok: false, error: GENERIC_UNREADABLE_MESSAGE };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(responseText);
  } catch (err) {
    console.error("[ocr] Gemini returned non-JSON response:", err);
    return { ok: false, error: GENERIC_UNREADABLE_MESSAGE };
  }

  const parsed = ocrResultSchema.safeParse(parsedJson);
  if (!parsed.success) {
    console.error("[ocr] Gemini response failed schema validation:", parsed.error.flatten());
    return { ok: false, error: GENERIC_UNREADABLE_MESSAGE };
  }

  return { ok: true, data: parsed.data };
}
