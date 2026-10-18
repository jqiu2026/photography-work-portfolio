import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import type { Align, Side } from "../interaction/floating";
export type PopoverProps = {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    side?: Side;
    align?: Align;
    offset?: number;
    children: ReactNode;
};
/**
 * A non-modal panel anchored to its trigger. It lives in the top layer (native `popover`), is positioned by the
 * floating engine (flips and stays on screen), and closes on Escape or an outside press. Use `Dialog` when the
 * content must block the page, `DropdownMenu` for a list of actions.
 */
export declare function Popover({ open: controlled, defaultOpen, onOpenChange, side, align, offset, children, }: PopoverProps): import("react").JSX.Element;
export declare function PopoverTrigger({ asChild, onClick, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
}): import("react").JSX.Element;
export type PopoverContentProps = HTMLAttributes<HTMLDivElement> & {
    "aria-label"?: string;
    "aria-labelledby"?: string;
};
export declare function PopoverContent({ className, children, ...rest }: PopoverContentProps): import("react").JSX.Element | null;
