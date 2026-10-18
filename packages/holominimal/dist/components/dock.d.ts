import { type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode, type Ref } from "react";
import type { ProximityOptions } from "../interaction/proximity";
export type DockProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
    /** Names the navigation landmark ("Studio sections"). Required: a page may have several navs. */
    "aria-label": string;
    /** Brand or home link pinned to the top of the dock (see DockBrand). */
    brand?: ReactNode;
    /** The edge a `fixed` dock sits on. A right dock mirrors the layout and measures the pointer from its right edge. Default `left`. */
    side?: "left" | "right";
    /** `fixed` pins the dock to the viewport's left edge (an app sidebar); `inline` keeps it in flow (demos, panels). */
    placement?: "fixed" | "inline";
    /** Tunes the magnification (reach, range, smoothing...). Read once per mount. */
    proximity?: ProximityOptions;
    ref?: Ref<HTMLElement>;
    children: ReactNode;
};
/**
 * The Holominimal sidebar: transparent, integrated with the page, and spatially responsive. The current entry is the
 * largest and brightest; entries near a mouse pointer swell and brighten; distant ones recede. Touch devices, keyboard
 * users and reduced motion get the same hierarchy without the magnification (focus still lifts the focused entry).
 * Below 860px the dock becomes a conventional top strip.
 */
export declare function Dock({ brand, placement, side, proximity, className, ref, children, ...rest }: DockProps): import("react").JSX.Element;
type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    /** Render your router's link instead of <a>: `<DockItem asChild current><Link href="/x">X</Link></DockItem>`. */
    asChild?: boolean;
    ref?: Ref<HTMLAnchorElement>;
};
export type DockItemProps = LinkProps & {
    /** This entry is the current page (sets aria-current="page"). Exactly one entry should be current. */
    current?: boolean;
    /** Pages under this entry, usually only for the current one (see DockSubnav). */
    subnav?: ReactNode;
};
export declare function DockItem({ current, subnav, asChild, className, children, ...rest }: DockItemProps): import("react").JSX.Element;
export declare function DockBrand({ asChild, className, ...rest }: LinkProps): import("react").JSX.Element;
export type DockSubnavProps = HTMLAttributes<HTMLUListElement> & {
    "aria-label": string;
};
/** The current section's pages, listed under its entry so nothing is hidden behind a click. */
export declare function DockSubnav({ className, ...rest }: DockSubnavProps): import("react").JSX.Element;
export declare function DockSubItem({ current, asChild, className, ...rest }: LinkProps & {
    current?: boolean;
}): import("react").JSX.Element;
export {};
