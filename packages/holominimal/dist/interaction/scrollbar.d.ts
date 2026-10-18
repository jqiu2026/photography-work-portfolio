/**
 * Overlay scrollbars for a native scroll container. The browser keeps scrolling (wheel, touch, keyboard, find in page);
 * this only reads the scroll metrics and writes CSS variables for custom thumbs, and lets a thumb be dragged or its
 * track pressed. Writes on `root`: `--_vy`/`--_vh` (vertical thumb offset and size, px), `--_hx`/`--_hw` (horizontal),
 * `data-scrollable-y|x`, `data-at-start|end-y|x` (for edge fades) and `data-scrolling` (for a few hundred ms after
 * scrolling, to reveal the thumb). Frame-batched, read-then-write. Returns a cleanup function.
 */
export declare function createScrollbars(root: HTMLElement, viewport: HTMLElement): () => void;
