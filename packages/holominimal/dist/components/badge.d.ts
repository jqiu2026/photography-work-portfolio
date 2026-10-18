import type { HTMLAttributes } from "react";
export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "muted" | "info";
export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    /** Color carries meaning only: success = live, warning = expiring, muted = archived. */
    tone?: Tone;
    /** `soft` sits on the page; `overlay` sits on a photograph (blurred black behind). */
    appearance?: "soft" | "overlay" | "outline";
};
/** A small label: gallery state, plan, count. Server-compatible. */
export declare function Badge({ tone, appearance, className, ...rest }: BadgeProps): import("react").JSX.Element;
export type StatusProps = HTMLAttributes<HTMLSpanElement> & {
    tone?: Tone;
};
/** A dot and a label ("Live", "Draft"). The label is always text, so status never depends on color. */
export declare function Status({ tone, className, children, ...rest }: StatusProps): import("react").JSX.Element;
