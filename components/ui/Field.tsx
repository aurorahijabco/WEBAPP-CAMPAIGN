"use client";

import { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="label" {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...props} />;
}

function EyeIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className} aria-hidden="true">
      <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className} aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.13A10.9 10.9 0 0 1 12 5c6.5 0 10.5 7 10.5 7a17.3 17.3 0 0 1-3.66 4.53M6.6 6.6C3.9 8.3 1.5 11.5 1.5 12s4 7.5 10.5 7.5a10.6 10.6 0 0 0 4.24-.88" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

/**
 * Password field with a show/hide toggle. Wraps the shared `Input` — same
 * styling/validation/props, only the type flips between "password"/"text"
 * client-side. No value is stored or exposed anywhere beyond the input itself.
 */
export function PasswordInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-11", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-plum-400 transition-colors hover:text-plum-600 focus-visible:text-plum-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50 dark:text-cream-100/50 dark:hover:text-cream-100 dark:focus-visible:text-cream-100 rounded-r-2xl"
      >
        {visible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
      </button>
    </div>
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={cn("input", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input min-h-[100px]", className)} {...props} />;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-danger">{message}</p>;
}
