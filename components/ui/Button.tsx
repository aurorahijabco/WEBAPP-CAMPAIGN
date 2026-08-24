"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "gold" | "danger";
type Size = "md" | "sm";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const map: Record<Variant, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    gold: "btn-gold",
    danger: "btn-danger",
  };
  return <button className={cn(map[variant], size === "sm" && "btn-sm", className)} {...props} />;
}
