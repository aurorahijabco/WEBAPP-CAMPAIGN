import { IconChevronDown } from "@/components/icons";

/**
 * Native <details>/<summary> accordion — no client JS needed, works with
 * keyboard/screen readers out of the box, and respects the existing
 * card/dark-mode tokens. Used to tuck long S&K/detail copy behind a tap
 * while keeping the crucial facts on the page unconditionally.
 *
 * Padding is owned entirely by this component (card's own p-5 is zeroed
 * out) so header and content always share the same horizontal inset and
 * the collapsed state never looks clipped at the bottom edge.
 */
export function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group card overflow-hidden p-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-[13.5px] font-bold text-plum-600 marker:content-none [&::-webkit-details-marker]:hidden sm:px-5 dark:text-cream-100">
        <span>{title}</span>
        <IconChevronDown className="h-4 w-4 shrink-0 text-plum-400 transition-transform duration-200 group-open:rotate-180 dark:text-cream-100/60" />
      </summary>
      <div className="border-t border-dashed border-cream-200 px-4 pb-5 pt-4 sm:px-5 dark:border-plum-500/30">
        {children}
      </div>
    </details>
  );
}
