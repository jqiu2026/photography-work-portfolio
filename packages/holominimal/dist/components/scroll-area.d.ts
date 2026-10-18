import { type HTMLAttributes } from "react";
export type ScrollAreaProps = HTMLAttributes<HTMLDivElement> & {
    /** Which scrollbars to offer. Default `vertical`. */
    orientation?: "vertical" | "horizontal" | "both";
    /** Fade the content toward an edge that has more to scroll. Default true. */
    fade?: boolean;
    /** Names the scrollable region (recommended: a scroll container is focusable). */
    "aria-label"?: string;
};
/**
 * A scroll container with slim overlay scrollbars that appear while you scroll or hover, and edge fades that show
 * where there is more. Native scrolling is untouched (wheel, touch, keyboard, find in page); the thumbs are drawn
 * from the scroll metrics and can be dragged. Give it a height (or `max-height`) in CSS.
 */
export declare function ScrollArea({ orientation, fade, className, children, ...rest }: ScrollAreaProps): import("react").JSX.Element;
