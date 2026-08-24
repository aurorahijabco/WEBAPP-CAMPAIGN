import { REDEEM_PRODUCT_NAME, REDEEM_PRODUCT_REFERENCE_PRICE } from "@/lib/constants";
import { RedeemForm } from "./RedeemForm";
import { formatIDR } from "@/lib/utils";

export default function RedeemPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Redeem Voucher</h1>
        <p className="mt-1 text-sm text-plum-400 dark:text-cream-100/70">
          Masukkan kode voucher pelanggan, pilih produk {REDEEM_PRODUCT_NAME} (harga referensi{" "}
          {formatIDR(REDEEM_PRODUCT_REFERENCE_PRICE)}), lalu konfirmasi. Sistem otomatis memvalidasi cabang, status,
          dan periode redemption.
        </p>
      </div>
      <RedeemForm />
    </div>
  );
}
