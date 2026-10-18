import type { ElementType, HTMLAttributes, ReactNode, Ref } from "react";
/** A step of the spacing scale (`1` is `--hm-space-1` ... `9`), `0`, or any CSS length. */
export type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | (string & {});
type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "between" | "around";
type Base<T extends HTMLElement = HTMLElement> = Omit<HTMLAttributes<T>, "color"> & {
    /** Render another element, such as `section`, `ul` or `nav`. */
    as?: ElementType;
    ref?: Ref<T>;
    children?: ReactNode;
};
type SpacingProps = {
    /** Padding on every side. */
    p?: Space;
    /** Horizontal padding. */
    px?: Space;
    /** Vertical padding. */
    py?: Space;
    /** Margin on every side. */
    m?: Space;
    /** Horizontal margin (`auto` centers). */
    mx?: Space;
    /** Vertical margin. */
    my?: Space;
};
export type BoxProps = Base & SpacingProps & {
    radius?: "sm" | "md" | "lg" | "xl" | "full";
};
/** The plain building block: any element, with spacing shorthands and a radius from the scale. */
export declare function Box({ as: As, radius, className, style, ...props }: BoxProps): import("react").JSX.Element;
export type StackProps = Base & SpacingProps & {
    gap?: Space;
    align?: Align;
    justify?: Justify;
};
/** Children in a column with one gap between them. */
export declare function Stack({ as: As, gap, align, justify, className, style, ...props }: StackProps): import("react").JSX.Element;
export type InlineProps = Base & SpacingProps & {
    gap?: Space;
    align?: Align;
    justify?: Justify;
    wrap?: boolean;
};
/** Children in a row that wraps, with one gap between them. */
export declare function Inline({ as: As, gap, align, justify, wrap, className, style, ...props }: InlineProps): import("react").JSX.Element;
export type GridProps = Base & SpacingProps & {
    /** A fixed column count; without it columns fill as many `min`-wide tracks as fit. */
    columns?: number;
    /** Smallest track width when auto-filling. Default 24rem. */
    min?: string;
    gap?: Space;
    /** Space between rows, when it differs from `gap`. */
    rowGap?: Space;
};
/** A responsive grid: fixed `columns`, or auto-fit tracks no narrower than `min`. */
export declare function Grid({ as: As, columns, min, gap, rowGap, className, style, ...props }: GridProps): import("react").JSX.Element;
export type ContainerProps = Base & SpacingProps & {
    size?: "sm" | "md" | "lg" | "xl" | "full";
};
/** A centered column with a maximum width and side gutters. */
export declare function Container({ as: As, size, className, style, ...props }: ContainerProps): import("react").JSX.Element;
/** Fills the free space in a flex row or column (or sets a fixed `size`). */
export declare function Spacer({ size, className, style, ...rest }: {
    size?: Space;
} & HTMLAttributes<HTMLSpanElement>): import("react").JSX.Element;
/** Centers its children on both axes. */
export declare function Center({ as: As, className, style, ...props }: Base & SpacingProps): import("react").JSX.Element;
/** Keeps a box at a fixed ratio, such as `16 / 9`. */
export declare function AspectRatio({ ratio, className, style, ...rest }: {
    ratio?: string | number;
} & HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
/** Content for screen readers only. */
export declare function VisuallyHidden({ as: As, className, ...rest }: Base): import("react").JSX.Element;
export type TextSize = "2xs" | "xs" | "sm" | "md" | "base" | "lg" | "xl" | "2xl" | "3xl";
export type TextProps = Base & {
    size?: TextSize;
    tone?: "default" | "soft" | "muted" | "dim" | "accent" | "success" | "warning" | "danger";
    weight?: "regular" | "medium" | "semibold";
    align?: "start" | "center" | "end";
    /** One line with an ellipsis. */
    truncate?: boolean;
    mono?: boolean;
    /** Small uppercase label above a heading. */
    eyebrow?: boolean;
};
/** Text on the type scale and the text-color tokens. A `p` by default. */
export declare function Text({ as: As, size, tone, weight, align, truncate, mono, eyebrow, className, ...rest }: TextProps): import("react").JSX.Element;
export type HeadingProps = Omit<TextProps, "eyebrow"> & {
    /** The element (`h1`-`h6`), which also picks the default size. */
    level?: 1 | 2 | 3 | 4 | 5 | 6;
};
/** A heading: the level sets the element and a default size, which `size` can override. */
export declare function Heading({ level, as, size, weight, className, ...rest }: HeadingProps): import("react").JSX.Element;
export {};
