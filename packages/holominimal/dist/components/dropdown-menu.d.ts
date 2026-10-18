import { type ButtonHTMLAttributes, type HTMLAttributes, type MouseEvent, type ReactNode, type RefObject } from "react";
import type { Align, Side } from "../interaction/floating";
type MenuContextValue = {
    open: boolean;
    setOpen: (open: boolean) => void;
    triggerRef: RefObject<HTMLElement | null>;
    menuId: string;
    side: Side;
    align: Align;
};
/** @internal Shared with ContextMenu, which anchors the same menu at the pointer instead of a trigger. */
export declare function useMenu(part: string): MenuContextValue;
export type DropdownMenuProps = {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    side?: Side;
    align?: Align;
    children: ReactNode;
};
/**
 * The menu button pattern: a trigger that opens a list of actions. Arrow keys move through items (wrapping), Home and
 * End jump, typing a letter jumps to the next matching item, Escape closes and returns focus, Tab closes.
 */
export declare function DropdownMenu({ open: controlled, defaultOpen, onOpenChange, side, align, children, }: DropdownMenuProps): import("react").JSX.Element;
export declare function DropdownMenuTrigger({ asChild, onClick, onKeyDown, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
}): import("react").JSX.Element;
export declare function DropdownMenuContent({ className, onKeyDown, children, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element | null;
export type DropdownMenuItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> & {
    asChild?: boolean;
    /** Runs when the item is chosen by click, Enter or Space. Call `event.preventDefault()` to keep the menu open. */
    onSelect?: (event: MouseEvent<HTMLElement>) => void;
    tone?: "default" | "danger";
};
export declare function DropdownMenuItem({ asChild, onSelect, tone, disabled, className, onClick, ...rest }: DropdownMenuItemProps): import("react").JSX.Element;
export declare function DropdownMenuLabel({ className, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
export declare function DropdownMenuSeparator({ className, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
export {};
