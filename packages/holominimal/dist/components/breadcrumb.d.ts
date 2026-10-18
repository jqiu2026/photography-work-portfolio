import type { AnchorHTMLAttributes, HTMLAttributes, LiHTMLAttributes, Ref } from "react";
export type BreadcrumbProps = HTMLAttributes<HTMLElement>;
/** A trail of ancestors ending at the current page. Separators are drawn by CSS, so they are never read aloud. */
export declare function Breadcrumb({ className, children, ...rest }: BreadcrumbProps): import("react").JSX.Element;
export declare function BreadcrumbItem({ className, ...rest }: LiHTMLAttributes<HTMLLIElement>): import("react").JSX.Element;
export declare function BreadcrumbLink({ asChild, className, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    asChild?: boolean;
    ref?: Ref<HTMLAnchorElement>;
}): import("react").JSX.Element;
/** The current page: plain text with `aria-current="page"`. */
export declare function BreadcrumbPage({ className, ...rest }: HTMLAttributes<HTMLSpanElement>): import("react").JSX.Element;
