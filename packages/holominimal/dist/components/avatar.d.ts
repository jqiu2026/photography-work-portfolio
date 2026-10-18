import { type HTMLAttributes } from "react";
export type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
    src?: string;
    /** The person or entity's name: the image's alt text and the source of the initials fallback. */
    name: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    shape?: "circle" | "square";
    /** A status dot in the corner. */
    status?: "online" | "away" | "busy" | "offline";
};
/**
 * A photo with an initials fallback (shown while loading, and if the image fails). The fallback is tinted from the
 * name, so a list of people is distinguishable at a glance.
 */
export declare function Avatar({ src, name, size, shape, status, className, style, ...rest }: AvatarProps): import("react").JSX.Element;
export type AvatarGroupProps = HTMLAttributes<HTMLDivElement> & {
    /** Show at most this many children, then a "+N" chip. */
    max?: number;
    /** Total people when more than the children given (shows "+N" from this). */
    total?: number;
};
/** Overlapping avatars with a "+N" overflow chip. */
export declare function AvatarGroup({ max, total, className, children, ...rest }: AvatarGroupProps): import("react").JSX.Element;
