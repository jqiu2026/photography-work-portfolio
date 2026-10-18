import { type HTMLAttributes } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./dropdown-menu";
/** A right-click (or long-press, or the keyboard's menu key) menu: the DropdownMenu, placed at the pointer. */
export declare function ContextMenu({ children, ...rest }: Omit<Parameters<typeof DropdownMenu>[0], "side" | "align">): import("react").JSX.Element;
/**
 * The area that owns the menu. It is focusable so the menu key and Shift+F10 work from the keyboard, and focus returns
 * to it when the menu closes. On touch, holding for half a second opens the menu (iOS sends no contextmenu event).
 */
export declare function ContextMenuTrigger({ className, onContextMenu, onPointerDown, onPointerUp, onPointerCancel, onPointerMove, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
export declare const ContextMenuContent: typeof DropdownMenuContent;
export declare const ContextMenuItem: typeof DropdownMenuItem;
export declare const ContextMenuLabel: typeof DropdownMenuLabel;
export declare const ContextMenuSeparator: typeof DropdownMenuSeparator;
