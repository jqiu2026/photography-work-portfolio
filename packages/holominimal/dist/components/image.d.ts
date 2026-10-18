import { type ImgHTMLAttributes, type Ref } from "react";
export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt" | "placeholder"> & {
    /** Required. Use `alt=""` only for decorative images. */
    alt: string;
    /** Aspect ratio of the frame, e.g. `"3 / 2"`. Reserves the space so nothing shifts when the image arrives. */
    ratio?: string;
    /** A CSS color or a tiny data URL / image URL shown (blurred) until the image has loaded. */
    placeholder?: string;
    /** Slowly scale to 1.04 when the frame is hovered or focused (the gallery card behavior). */
    zoom?: boolean;
    fit?: "cover" | "contain";
    frameClassName?: string;
    ref?: Ref<HTMLImageElement>;
};
/**
 * An image in a fixed frame with a blur-up placeholder and a fade-in. Lazy and async-decoded by default. Without JS, or if the
 * image is already complete when React hydrates, it is shown at once instead of fading.
 */
export declare function Image({ ratio, placeholder, zoom, fit, frameClassName, className, loading, decoding, onLoad, onError, ref, ...rest }: ImageProps): import("react").JSX.Element;
