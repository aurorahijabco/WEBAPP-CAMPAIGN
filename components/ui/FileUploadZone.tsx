"use client";

import { useState, ChangeEvent } from "react";

export function FileUploadZone({
  id,
  name,
  required,
}: {
  id: string;
  name: string;
  required?: boolean;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setFileName(e.target.files?.[0]?.name ?? null);
  }

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-plum-300/50 px-5 py-6 text-center transition hover:border-gold-400 hover:bg-cream-50 dark:border-plum-500/40 dark:hover:bg-plum-700/40"
    >
      <input id={id} name={name} type="file" accept="image/*" required={required} onChange={handleChange} className="sr-only" />
      {fileName ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-success">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <p className="max-w-full truncate text-[12.5px] font-bold text-plum-600 dark:text-cream-100">{fileName}</p>
          <p className="text-[11px] text-plum-400 dark:text-cream-100/60">Ketuk untuk ganti foto</p>
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-gold-500">
            <path d="M12 16V4M7 9l5-5 5 5" />
            <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
          </svg>
          <p className="text-[13px] font-bold text-plum-600 dark:text-cream-100">Unggah Foto Struk</p>
          <p className="text-[11px] text-plum-400 dark:text-cream-100/60">Maksimal 5MB. Pastikan struk terbaca jelas.</p>
        </>
      )}
    </label>
  );
}
