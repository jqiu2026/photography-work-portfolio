/** What the cursor is over. `pressed` is separate (a pointer button is down); `hidden` removes it (`data-hm-cursor="none"`). */
export type CursorState = "default" | "link" | "text" | "hidden";
export type CursorOptions = {
    /** Where the cursor lives. Default: the whole page. Pass an element to scope it to that region. */
    scope?: HTMLElement | null;
    /** Time constant of the dot's follow, in ms. `0` is instant. Default 60. */
    smoothing?: number;
    /** Time constant of the trailing ring, spotlight and icon, in ms. Default 170. */
    ringSmoothing?: number;
    /** 0 to 1: how far the ring is pulled toward the center of an interactive element under the pointer. Default 0. */
    magnetic?: number;
    /** The ring takes the size and shape of the interactive element under it (like a tablet's pointer). Default false. */
    morph?: boolean;
    /** Turn the icon to face the direction of travel. Default false. */
    rotate?: boolean;
    /** Where the icon's hotspot is, as [x, y] from -1 to 1 across the icon (0, 0 is the center; an arrow's tip is about [-0.54, -0.67]). It sits on the pointer, turns about it, and the trail starts there. Default center. */
    iconAnchors?: {
        default?: [number, number];
        link?: [number, number];
        text?: [number, number];
    };
    /** Trail width in px. Default: the cursor's own width (the dot's size, a thin line for a crosshair or ring, a medium stroke for an icon). */
    trailWidth?: number;
    /** Which way your icon points, in degrees clockwise from straight up (a rocket is 0, an arrow tip at the upper left is about -35). `rotate` turns that tip toward the direction of travel. Default 0. */
    iconPoints?: number;
    /** Hide the system cursor in the scope. Default true. */
    hideNative?: boolean;
    /** Send a ripple out from the cursor on press. Default false. */
    ripple?: boolean;
    /** Diameter, in px, the ripple grows to. Default 80. */
    rippleSize?: number;
    /** Called when the state under the pointer changes. */
    onStateChange?: (state: CursorState) => void;
};
export type CursorHandle = {
    destroy: () => void;
    state: () => CursorState;
};
/**
 * A custom cursor as a framework-free engine. The markup is yours (the `Cursor` component renders one): `root` holds
 * parts marked `data-part="dot" | "ring" | "icon" | "spot" | "trail" | "label"`, and the engine only moves them. The
 * dot follows the pointer with a short exponential ease; the ring, icon, spotlight and trail follow with longer ones,
 * so the cursor glides instead of jumping, and never drifts out of time with the pointer (frame-rate independent).
 *
 * Behavior: it reads what is under the pointer and sets `data-state` on `root` (`default`, `link`, `text`, `hidden`),
 * `data-pressed` while a button is down and `data-visible` while the pointer is in the scope. Elements can ask for
 * things with attributes: `data-hm-cursor="none | link | text"` and `data-hm-cursor-label="View"` (a label next to the
 * cursor). With `morph` the ring takes the shape of the interactive element under it; `magnetic` pulls it toward the
 * element's center; `rotate` turns the icon's tip toward the direction of travel (see `iconPoints`). Fine pointers only; reduced motion removes
 * the easing and ripples (the cursor still shows).
 */
export declare function createCursor(root: HTMLElement, options?: CursorOptions): CursorHandle;
