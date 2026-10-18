export type IndicatorOptions = {
    /** Selector for the items inside the container. */
    item: string;
    /** Selector for the active item (matched inside the container). */
    active: string;
};
/**
 * A sliding indicator for a row (or column) of items, for tabs and segmented controls. It measures the active item and
 * writes `--_ix`, `--_iy`, `--_iw`, `--_ih` (px, relative to the container) so CSS can transition a pseudo-element
 * between items. `data-indicator` is set only after the first measurement has been laid out, so the indicator
 * appears in place instead of sliding in from the corner. It follows resizes and selection changes and never sets
 * React state. Returns a cleanup function.
 */
export declare function createIndicator(container: HTMLElement, { item, active }: IndicatorOptions): () => void;
