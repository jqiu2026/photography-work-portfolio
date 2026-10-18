import { type AnchorHTMLAttributes, type HTMLAttributes, type Ref } from "react";
/**
 * Sibling pages as text tabs. These are links (navigation), not an ARIA tablist; see Tabs for panels. The underline
 * slides to the current page when it changes (as long as the tabs stay mounted across navigation, as they do in a shared
 * layout), and it is placed without sliding on first paint.
 */
export declare function PageTabs({ className, ...rest }: HTMLAttributes<HTMLElement> & {
    "aria-label": string;
}): import("react").JSX.Element;
export declare function PageTab({ current, asChild, className, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    current?: boolean;
    asChild?: boolean;
    ref?: Ref<HTMLAnchorElement>;
}): import("react").JSX.Element;
