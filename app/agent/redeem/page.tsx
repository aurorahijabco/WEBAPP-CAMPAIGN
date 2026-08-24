import { REDEEM_PRODUCT_NAME, REDEEM_PRODUCT_REFERENCE_PRICE } from "@/lib/constants";
import { RedeemForm } from "./RedeemForm";

export default function RedeemPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-plum-600">Redeem Voucher</h1>
      <p className="text-sm text-plum-400">
        Masukkan kode voucher pelanggan, pilih produk {REDEEM_PRODUCT_NAME} (harga referensi{" "}
        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(
          REDEEM_PRODUCT_REFERENCE_PRICE
        )}
        ), lalu konfirmasi. Sistem otomatis memvalidasi cabang, status, dan periode redemption.
      </p>
      <RedeemForm />
    </div>
  );
}
