export type LightFieldOptions = {
    /** Surfaces that receive pointer light. Default: lit and holo surfaces. */
    selector?: string;
    /** Max tilt in degrees for surfaces with `data-tilt`. Default 4. 0 disables tilt. */
    tilt?: number;
    /**
     * Also write --hm-mx/--hm-my (viewport px) for an Atmosphere spotlight. They go onto each `.hm-atmosphere` and
     * `[data-hm-track]` element inside the container, not onto the container, so a pointer frame restyles those few
     * elements and not the whole page. Default true.
     */
    track?: boolean;
    /** Time constant of the light's easing, ms. Larger is slower and softer. Default 110. */
    ease?: number;
};
/**
 * Pointer light for every lit surface inside a container, with one delegated listener. The light never jumps: the
 * pointer position is a target that a frame-rate independent exponential ease (`1 - e^(-dt/tau)`) chases, so the
 * spotlight (--hm-mx/--hm-my), each lit surface's local light (--hm-px/--hm-py) and the tilt (--hm-rx/--hm-ry) glide
 * to where the pointer is. None of these inherit into a surface's content, so a frame restyles only the elements that
 * draw the light. Local positions are derived from the eased point every frame, so scrolling content under a
 * still pointer moves the light smoothly too. The loop runs only while something is moving, reads all layout before
 * writing, fine pointers only; tilt is skipped under reduced motion and easing is skipped (the light snaps).
 */
export declare function createLightField(container: HTMLElement, options?: LightFieldOptions): () => void;
