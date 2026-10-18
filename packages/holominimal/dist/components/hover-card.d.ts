import { type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import type { Align, Side } from "../interaction/floating";
export type HoverCardProps = {
    /** Hover time before it opens, ms. Keyboard focus opens it sooner. Default 450. */
    openDelay?: number;
    /** Grace time to move the pointer from the trigger into the card, ms. Default 180. */
    closeDelay?: number;
    side?: Side;
    align?: Align;
    children: ReactNode;
};
/**
 * A preview card for a link or a name: it opens on hover (fine pointers) or keyboard focus, stays open while the pointer
 * is on the trigger or the card, and closes on Escape. For essential content use `Popover`; the card is a convenience.
 */
export declare function HoverCard({ openDelay, closeDelay, side, align, children, }: HoverCardProps): import("react").JSX.Element;
/** The element that opens the card (a link, an avatar, a name). It must accept a ref and pointer and focus handlers. */
export declare function HoverCardTrigger({ children }: {
    children: ReactElement<Record<string, unknown>>;
}): ReactElement<Record<string, unknown>, string | import("react").JSXElementConstructor<any>>;
export declare function HoverCardContent({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element | null;
