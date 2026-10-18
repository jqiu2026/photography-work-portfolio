export type Side = "top" | "bottom" | "left" | "right";
export type Align = "start" | "center" | "end";
export type FloatingOptions = {
    side?: Side;
    align?: Align;
    /** Gap between anchor and floating element, px. */
    offset?: number;
    /** Minimum distance kept from the viewport edge, px. */
    padding?: number;
};
type Box = {
    x: number;
    y: number;
    width: number;
    height: number;
};
type Size = {
    width: number;
    height: number;
};
/** Pure placement: flips to the opposite side when the preferred one overflows, then keeps the box in the viewport. */
export declare function computePosition(anchor: Box, size: Size, viewport: Size, { side, align, offset, padding }?: FloatingOptions): {
    x: number;
    y: number;
    side: Side;
};
/**
 * Positions `floating` (a `popover="manual"` element, so it lives in the top layer) against `anchor`, and keeps it
 * there through scroll, resize and size changes. Writes `left`/`top`, `data-side` and `--hm-anchor-width`; never React
 * state. Returns a cleanup that hides the element.
 */
export declare function attachFloating(anchor: Element, floating: HTMLElement, options?: FloatingOptions): () => void;
export {};
