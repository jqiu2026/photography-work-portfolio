import type { ButtonHTMLAttributes, ElementType, ReactNode } from "react";
import { cx } from "./cx";

export type ButtonProps = {
  variant?: "solid" | "ghost" | "quiet" | "accent";
  size?: "sm" | "md" | "lg";
  as?: ElementType;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  [k: string]: unknown;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { className?: string };

/** Pass `as="a"` (or a router Link) with `href` to render a link that looks like a button. */
export function Button({
  variant = "solid",
  size = "md",
  as: As = "button",
  loading,
  iconLeft,
  iconRight,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const isButton = As === "button";
  return (
    <As
      className={cx("ph-btn", `ph-btn--${variant}`, `ph-btn--${size}`, className)}
      {...(isButton ? { type: (rest.type as string) ?? "button", disabled: disabled || loading } : {})}
      aria-busy={loading || undefined}
      {...rest}
    >
      {iconLeft ? (
        <span className="ph-btn__icon" aria-hidden>
          {iconLeft}
        </span>
      ) : null}
      <span>{children}</span>
      {iconRight ? (
        <span className="ph-btn__icon" aria-hidden>
          {iconRight}
        </span>
      ) : null}
    </As>
  );
}

/** Icon-only button. `label` is required: it becomes the accessible name. */
export function IconButton({
  label,
  variant = "quiet",
  size = "md",
  as: As = "button",
  className,
  children,
  ...rest
}: {
  label: string;
  variant?: "solid" | "ghost" | "quiet";
  size?: "sm" | "md" | "lg";
  as?: ElementType;
  className?: string;
  children: ReactNode;
  [k: string]: unknown;
}) {
  return (
    <As
      className={cx("ph-btn", "ph-btn--icon", `ph-btn--${variant}`, `ph-btn--${size}`, className)}
      aria-label={label}
      {...(As === "button" ? { type: "button" } : {})}
      {...rest}
    >
      <span aria-hidden>{children}</span>
    </As>
  );
}
