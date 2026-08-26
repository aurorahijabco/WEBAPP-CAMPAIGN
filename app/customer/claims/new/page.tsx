import { ClaimUploadFlow } from "./ClaimUploadFlow";

export default function NewClaimPage() {
  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Klaim Baru</h1>
        <p className="mt-1 text-sm text-plum-400 dark:text-cream-100/70">
          Unggah struk pembelian Series Agustin — cabang, item, dan nominal akan terbaca otomatis.
        </p>
      </div>
      <div className="card sm:p-7">
        <ClaimUploadFlow />
      </div>
    </div>
  );
}
