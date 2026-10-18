/**
 * Proximity magnification: the behavior behind the Holominimal sidebar, as a framework-free engine.
 *
 * Every item gets a weight `k` in [0, 1], written as a CSS custom property (default `--hm-k`); CSS turns it into scale,
 * offset and color. The current item (aria-current / data-active) is always 1. Other items rest small, fading with
 * their distance (in items) from the current one. A fine pointer near the container lifts items with a Gaussian
 * falloff along the main axis; keyboard focus lifts the focused item. Weights ease toward their targets with a
 * per-frame lerp, and the loop stops as soon as everything settles, so nothing runs while idle.
 *
 * Performance: no React state. One passive window listener; each frame reads every hit-rect first, then writes every
 * custom property (no layout thrash). Hit-testing uses each item's parent (the <li>), which never moves; the item
 * itself scales, so measuring it would feed back into the pointer distance (that was the jitter in the original).
 */
export type ProximityOptions = {
    /** Items inside the container. Default `[data-hm-proximity-item]`. */
    itemSelector?: string;
    /** Main axis the items are laid out along. Default `y` (a vertical list). */
    axis?: "x" | "y";
    /** Distance in px along the main axis over which the pointer magnifies an item (Gaussian sigma). Default 96. */
    reach?: number;
    /** Distance in px from the container's edge on the cross axis within which the pointer counts. Default 300. */
    range?: number;
    /** Which cross-axis edge `range` is measured from: `start` (left, or top for `axis: "x"`) or `end` (right, or bottom). Default `start`. */
    edge?: "start" | "end";
    /** Cross-axis inset in px before the falloff begins. Default 24. */
    inset?: number;
    /** Resting weight far from the current item. Default 0.1. */
    restBase?: number;
    /** Extra resting weight next to the current item. Default 0.3. */
    restSpread?: number;
    /** How many items the resting weight takes to fall off. Default 3. */
    restFalloff?: number;
    /** Ceiling for a non-current item (so the current one stays the largest). Default 0.92. */
    peak?: number;
    /** Lerp factor per frame (0..1); higher is snappier. Default 0.18. */
    smoothing?: number;
    /** Custom property to write. Default `--hm-k`. */
    property?: string;
    /** Measure each item itself (`self`, for table rows) or its parent (`parent`, the default, for items that scale). */
    hit?: "parent" | "self";
    /** Only count the pointer while it is over the container (plus `reach` on the main axis), for hover highlights. */
    bounded?: boolean;
};
export declare function createProximity(container: HTMLElement, options?: ProximityOptions): () => void;
