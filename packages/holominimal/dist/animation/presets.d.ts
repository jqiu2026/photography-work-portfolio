/**
 * The animation presets (`animations.css`), by group. `enter` presets arrive, `attention` presets play once to draw the
 * eye, `loop` presets repeat until stopped, `exit` presets leave and stay gone. Names are the values of
 * `data-hm-anim`.
 */
export declare const animations: {
    enter: readonly ["fade-in", "fade-up", "fade-down", "fade-left", "fade-right", "slide-up", "slide-down", "slide-left", "slide-right", "zoom-in", "zoom-out", "pop", "blur-in", "flip-x", "flip-y", "rotate-in", "swing-in", "drop", "unfold", "expand", "wipe-up", "wipe-down", "curtain", "spring-up", "tilt-in", "skew-in", "letter-in"];
    attention: readonly ["pulse", "heartbeat", "shake", "wiggle", "bounce", "jello", "rubber", "tada", "flash", "swing", "ping", "blink", "flip-once", "hop", "nudge-right", "nudge-left", "nudge-up", "nudge-down", "spin-once"];
    loop: readonly ["float", "breathe", "glow-pulse", "spin", "orbit", "sway", "shimmer-slide", "wave-y", "rise-fall"];
    exit: readonly ["fade-out", "fade-out-up", "fade-out-down", "zoom-exit", "shrink", "blur-out", "fall", "slide-out-left", "slide-out-right"];
};
export type EnterAnimation = (typeof animations.enter)[number];
export type AttentionAnimation = (typeof animations.attention)[number];
export type LoopAnimation = (typeof animations.loop)[number];
export type ExitAnimation = (typeof animations.exit)[number];
export type AnimationName = EnterAnimation | AttentionAnimation | LoopAnimation | ExitAnimation;
/** When a preset plays. `mount` is the default; `view` waits until the element scrolls into view. */
export type AnimationTrigger = "mount" | "view" | "hover" | "focus" | "click" | "manual" | "group";
export type AnimationOptions = {
    /** Milliseconds, or any CSS time. Each preset has its own default. */
    duration?: number | string;
    /** Milliseconds, or any CSS time. */
    delay?: number | string;
    /** A CSS easing, such as `var(--hm-ease-spring)`. */
    easing?: string;
    /** Number of plays, or `infinite`. */
    count?: number | "infinite";
    direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
    /** How far fade and slide presets travel, as a CSS length. */
    distance?: string;
    /** Milliseconds between staggered items (`--hm-i`). */
    step?: number | string;
};
/** The custom properties for a set of options, as a style object. Server-safe. */
export declare function animationVars(o?: AnimationOptions): Record<string, string>;
/**
 * Props to spread on any element (server or client) to play a preset:
 * `<h1 {...animationAttrs("fade-up", { delay: 120 })}>`. Pass `index` to stagger a list.
 */
export declare function animationAttrs(name: AnimationName, options?: AnimationOptions & {
    trigger?: AnimationTrigger;
    index?: number;
}): {
    "data-hm-anim": AnimationName;
    "data-hm-trigger": "view" | "group" | "click" | "focus" | "manual" | "hover" | undefined;
    style: import("react").CSSProperties;
};
/**
 * Plays a preset on an element now and resolves when it ends: `await animate(input, "shake")`. Replays if called again.
 * Entrance and attention presets clear themselves afterwards so the element rests normally; exit presets stay applied
 * (pass `keep: false` to clear them too). Resolves at once under reduced motion. Browser-only.
 */
export declare function animate(el: HTMLElement, name: AnimationName, options?: AnimationOptions & {
    keep?: boolean;
}): Promise<void>;
