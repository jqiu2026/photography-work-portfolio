import { type HTMLAttributes, type ReactNode } from "react";
export type CarouselProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
    /** Names the carousel (required). */
    "aria-label": string;
    /** Each child is one slide. */
    children: ReactNode;
    /** How many slides fit across. Default 1. */
    perView?: number;
    /** Gap between slides, CSS length. Default 1rem. */
    gap?: string;
    /** Advance on a timer, ms. Stops on hover and focus, and never runs under reduced motion. */
    autoplay?: number;
    /** Show the position dots. Default true. */
    dots?: boolean;
    /** Controlled and initial slide (zero-based). */
    index?: number;
    onIndexChange?: (index: number) => void;
};
/**
 * A scroll-snap carousel: touch and trackpad scrolling are native, buttons and the arrow keys move a slide at a time
 * with an eased scroll, and the dots stretch to show where you are. Each child is a slide announced as "N of M".
 */
export declare function Carousel({ children, perView, gap, autoplay, dots, index: controlled, onIndexChange, className, style, onKeyDown, ...rest }: CarouselProps): import("react").JSX.Element;
