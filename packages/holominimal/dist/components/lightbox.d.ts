export type LightboxItem = {
    src: string;
    alt: string;
    caption?: string;
    width?: number;
    height?: number;
};
export type LightboxProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: LightboxItem[];
    index: number;
    onIndexChange: (index: number) => void;
    /** Accessible name of the viewer. */
    label?: string;
    /** Wrap from the last photograph to the first. Default false. */
    loop?: boolean;
    className?: string;
};
/**
 * A full-screen viewer on the native <dialog> (top layer, focus trap, Escape, focus return). Left/Right and
 * swipe move between photographs, Home/End jump, the neighbors are preloaded, and the counter is a live region.
 * Controlled: the host owns `open` and `index`.
 */
export declare function Lightbox({ open, onOpenChange, items, index, onIndexChange, label, loop, className, }: LightboxProps): import("react").JSX.Element;
