export type SwipeDirection = "left" | "right" | "up" | "down";
export type SwipeOptions = {
    onSwipe: (direction: SwipeDirection) => void;
    /** Minimum travel in px. Default 48. */
    threshold?: number;
};
/** Pure: the dominant direction of a drag, or null when it was too short or too diagonal. */
export declare function swipeDirection(dx: number, dy: number, threshold?: number): SwipeDirection | null;
/**
 * Reports quick drags on `el` (touch and pen only; a mouse drag is left alone so text and images stay selectable).
 * Sets `touch-action: pan-y` so vertical scrolling still works. Returns a cleanup function.
 */
export declare function createSwipe(el: HTMLElement, { onSwipe, threshold }: SwipeOptions): () => void;
