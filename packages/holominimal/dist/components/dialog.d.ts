import { type ButtonHTMLAttributes, type DialogHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
export type DialogProps = {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: ReactNode;
};
/**
 * A modal dialog on the native <dialog> element: the browser provides the top layer, focus trapping, Escape and
 * focus return. Holominimal adds the elevated surface, the scrim, an entrance and exit, and backdrop-click to close.
 */
export declare function Dialog({ open: controlled, defaultOpen, onOpenChange, children }: DialogProps): import("react").JSX.Element;
export declare function DialogTrigger({ asChild, onClick, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
}): import("react").JSX.Element;
export type DialogContentProps = Omit<DialogHTMLAttributes<HTMLDialogElement>, "open"> & {
    /**
     * `center` (default), `top` (a command palette sits high), or a side sheet: `left`, `right` or `bottom`. Side sheets
     * slide in from their edge and, on touch, swipe back toward it to close.
     */
    position?: "center" | "top" | "left" | "right" | "bottom";
    size?: "sm" | "md" | "lg";
    /** Close when the scrim is clicked. Default true. */
    dismissible?: boolean;
};
export declare function DialogContent({ position, size, dismissible, className, children, onClick, ...rest }: DialogContentProps): import("react").JSX.Element;
export declare function DialogTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>): import("react").JSX.Element;
export declare function DialogDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>): import("react").JSX.Element;
export declare function DialogFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
export declare function DialogClose({ asChild, onClick, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
}): import("react").JSX.Element;
