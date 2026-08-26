import { IconChevronDown } from "@/components/icons";

/**
 * Native <details>/<summary> accordion — no client JS needed, works with
 * keyboard/screen readers out of the box, and respects the existing
 * card/dark-mode tokens. Used to tuck long S&K/detail copy behind a tap
 * while keeping the crucial facts on the page unconditionally.
 */
export function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group card open:pb-4 [&:not([open])]:pb-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 text-[13.5px] font-bold text-plum-600 marker:content-none dark:text-cream-100">
        {title}
        <IconChevronDown className="h-4 w-4 shrink-0 text-plum-400 transition-transform duration-200 group-open:rotate-180 dark:text-cream-100/60" />
      </summary>
      <div className="mt-3 border-t border-dashed border-cream-200 pt-3 dark:border-plum-500/30">{children}</div>
    </details>
  );
}
