import { type ReactElement, type ReactNode } from "react";
import type { Align, Side } from "../interaction/floating";
export type TooltipProps = {
    /** The tip text. Keep it to a short label; interactive content belongs in a `Popover`. */
    content: ReactNode;
    side?: Side;
    align?: Align;
    /** Hover delay before showing, ms. Keyboard focus shows it immediately. */
    delay?: number;
    className?: string;
    /** The single element that triggers the tip. It must accept a ref, `aria-describedby` and pointer/focus handlers. */
    children: ReactElement<Record<string, unknown>>;
};
/**
 * A label for a control, shown on hover (fine pointers only) and keyboard focus, hidden on Escape or blur. It
 * describes the trigger (`aria-describedby`); it never replaces an accessible name.
 */
export declare function Tooltip({ content, side, align, delay, className, children }: TooltipProps): import("react").JSX.Element;
