export type RevealOptions = {
    /** Elements to reveal. Default `[data-hm-reveal]`. */
    selector?: string;
    /** IntersectionObserver rootMargin. Default reveals slightly before the element enters. */
    rootMargin?: string;
    /** Reveal once and stop observing. Default true. */
    once?: boolean;
};
/**
 * Scroll reveals. Elements are only hidden once this runs (`data-hm-reveal="pending"`), so without JS, under reduced
 * motion, or before hydration, content is simply visible. Items already in view on start are shown at once.
 */
export declare function createReveal(container: HTMLElement, options?: RevealOptions): () => void;
