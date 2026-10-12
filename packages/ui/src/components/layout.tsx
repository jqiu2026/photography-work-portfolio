import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

type BoxProps<T extends ElementType> = {
  as?: T;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "style" | "children">;

export type ContainerProps = BoxProps<ElementType> & { size?: "sm" | "md" | "lg" | "full"; bleed?: boolean };
/** Centers content to a max width with fluid side gutters. */
export function Container({ as: As = "div", size = "lg", className, ...rest }: ContainerProps) {
  return <As className={cx("hl-container", `hl-container--${size}`, className)} {...rest} />;
}

export type StackProps = BoxProps<ElementType> & {
  gap?: 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 | 24;
  align?: "start" | "center" | "end" | "stretch";
};
export function Stack({ as: As = "div", gap = 4, align, className, style, ...rest }: StackProps) {
  return (
    <As
      className={cx("hl-stack", className)}
      style={
        {
          "--hl-gap": `var(--hl-space-${gap})`,
          alignItems: align && (align === "start" || align === "end" ? `flex-${align}` : align),
          ...style,
        } as CSSProperties
      }
      {...rest}
    />
  );
}

export type RowProps = BoxProps<ElementType> & {
  gap?: 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 | 24;
  align?: "start" | "center" | "end" | "baseline";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
};
export function Row({ as: As = "div", gap = 4, align = "center", justify, wrap, className, style, ...rest }: RowProps) {
  const map = {
    start: "flex-start",
    end: "flex-end",
    center: "center",
    between: "space-between",
    baseline: "baseline",
  } as const;
  return (
    <As
      className={cx("hl-row", wrap && "hl-row--wrap", className)}
      style={
        {
          "--hl-gap": `var(--hl-space-${gap})`,
          alignItems: map[align],
          justifyContent: justify && map[justify],
          ...style,
        } as CSSProperties
      }
      {...rest}
    />
  );
}

export type GridProps = BoxProps<ElementType> & { cols?: 1 | 2 | 3 | 4; gap?: 2 | 3 | 4 | 6 | 8 | 12; min?: string };
/** Responsive grid. Pass `min` (e.g. "16rem") for auto-fit columns, or `cols` for fixed columns that collapse on small screens. */
export function Grid({ as: As = "div", cols, gap = 6, min, className, style, ...rest }: GridProps) {
  return (
    <As
      className={cx("hl-grid", cols && `hl-grid--${cols}`, className)}
      style={
        {
          "--hl-gap": `var(--hl-space-${gap})`,
          ...(min ? { gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}), 1fr))` } : {}),
          ...style,
        } as CSSProperties
      }
      {...rest}
    />
  );
}

/** Page section with consistent vertical rhythm. */
export function Section({
  as: As = "section",
  tone,
  className,
  ...rest
}: BoxProps<ElementType> & { tone?: "default" | "surface" | "cinema" }) {
  return <As className={cx("hl-section", tone && tone !== "default" && `hl-section--${tone}`, className)} {...rest} />;
}
