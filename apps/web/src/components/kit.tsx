import {
  Badge as HmBadge,
  Button as HmButton,
  Container as HmContainer,
  Heading as HmHeading,
  IconButton as HmIconButton,
  Progress as HmProgress,
  Text as HmText,
} from "@holominimal/ui";
import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";

/*
 * The admin's building blocks, on Holominimal. They keep the small prop shapes the admin pages were written against
 * (`variant="solid"`, `as={NextLink}`, `label` on icon buttons, `tone="default"`), so the pages read the same.
 * Server-safe: no hooks here (fields, dialogs and toasts are in kit-client.tsx).
 */

type ButtonVariant = "solid" | "ghost" | "quiet" | "secondary" | "danger";
const buttonVariant = (v: ButtonVariant) => (v === "solid" ? "primary" : v === "quiet" ? "ghost" : v);

export function Button({
  variant = "solid",
  size = "md",
  as: As,
  href,
  iconLeft,
  iconRight,
  loading,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  as?: ElementType;
  href?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
  [k: string]: unknown;
}) {
  const body = (
    <>
      {iconLeft}
      {children}
      {iconRight}
    </>
  );
  if (As || href) {
    const El = As ?? "a";
    return (
      <HmButton asChild variant={buttonVariant(variant)} size={size}>
        <El href={href} {...rest}>
          {body}
        </El>
      </HmButton>
    );
  }
  return (
    <HmButton variant={buttonVariant(variant)} size={size} loading={loading} {...rest}>
      {body}
    </HmButton>
  );
}

export function IconButton({
  label,
  children,
  ...rest
}: { label: string; children: ReactNode; className?: string; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <HmIconButton aria-label={label} variant="ghost" {...rest}>
      {children}
    </HmIconButton>
  );
}

export function Badge({
  tone = "default",
  ...rest
}: { tone?: "default" | "accent" | "success" | "danger" | "warning" | "muted" } & HTMLAttributes<HTMLSpanElement>) {
  return <HmBadge tone={tone === "default" ? "neutral" : tone} {...rest} />;
}

export function Progress({ value, label, className }: { value: number; label: string; className?: string }) {
  return <HmProgress value={Math.max(0, Math.min(100, value))} aria-label={label} className={className} />;
}

type Size = "xs" | "sm" | "base" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
const textSize = (s: Size) => (s === "4xl" ? "3xl" : s);

export function Text({
  size = "base",
  tone = "default",
  ...rest
}: { as?: ElementType; size?: Size; tone?: "default" | "muted" | "accent" } & HTMLAttributes<HTMLElement>) {
  return <HmText size={textSize(size)} tone={tone} {...rest} />;
}

export function Heading({
  as = "h2",
  size = "3xl",
  display: _display,
  ...rest
}: { as?: ElementType; size?: Size; display?: boolean } & HTMLAttributes<HTMLHeadingElement>) {
  return <HmHeading as={as} size={textSize(size)} weight="semibold" {...rest} />;
}

export function Eyebrow(props: HTMLAttributes<HTMLParagraphElement>) {
  return <HmText eyebrow {...props} />;
}

export function Container({
  size = "lg",
  ...rest
}: { size?: "sm" | "md" | "lg" | "xl"; style?: CSSProperties; className?: string; children?: ReactNode }) {
  return <HmContainer size={size} {...rest} />;
}

export function Row({
  gap = 4,
  wrap: _wrap,
  style,
  ...rest
}: { gap?: 1 | 2 | 3 | 4 | 6 | 8; wrap?: boolean; style?: CSSProperties } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: `var(--hm-space-${gap})`, ...style }}
      {...rest}
    />
  );
}

export function Section({ style, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section style={{ paddingBlock: "clamp(2rem, 5vw, 4rem)", ...style }} {...rest} />;
}
