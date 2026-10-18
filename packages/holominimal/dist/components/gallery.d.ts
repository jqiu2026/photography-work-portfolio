import type { AnchorHTMLAttributes, HTMLAttributes, LiHTMLAttributes, ReactNode, Ref } from "react";
/** A responsive grid of gallery cards (a <ul>; give it an aria-label). */
export declare function GalleryGrid({ className, ...rest }: HTMLAttributes<HTMLUListElement>): import("react").JSX.Element;
export type GalleryItemProps = LiHTMLAttributes<HTMLLIElement> & {
    /** Position in the grid, for the staggered entrance (capped at 12 so long lists do not wait). */
    index?: number;
};
/** One grid cell; staggers in on mount. */
export declare function GalleryItem({ index, className, style, ...rest }: GalleryItemProps): import("react").JSX.Element;
export type GalleryCardProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    asChild?: boolean;
    ref?: Ref<HTMLAnchorElement>;
};
/** The whole card is one link: cover, title, meta. The cover zooms slowly and the title underlines on hover. */
export declare function GalleryCard({ asChild, className, ...rest }: GalleryCardProps): import("react").JSX.Element;
export type GalleryCoverProps = HTMLAttributes<HTMLSpanElement> & {
    /** Aspect ratio of the cover. Default 3 / 2. */
    ratio?: string;
    /** Pinned top-left over the image, usually a Badge with appearance="overlay". */
    badge?: ReactNode;
    /** Shown when there are no children (no photographs yet). */
    empty?: ReactNode;
};
export declare function GalleryCover({ ratio, badge, empty, className, style, children, ...rest }: GalleryCoverProps): import("react").JSX.Element;
export declare function GalleryTitle({ className, ...rest }: HTMLAttributes<HTMLElement>): import("react").JSX.Element;
export declare function GalleryMeta({ className, ...rest }: HTMLAttributes<HTMLElement>): import("react").JSX.Element;
