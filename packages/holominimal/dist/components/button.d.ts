import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    /**
     * `primary`: the one white action on a view. `secondary`: a hairline pill for tools. `ghost`: text that underlines
     * on hover (row actions). `danger`: destructive, quiet until hovered.
     */
    variant?: ButtonVariant;
    size?: ButtonSize;
    shape?: "rounded" | "pill";
    /** Shows a spinner, sets aria-busy, and blocks clicks while keeping focus. */
    loading?: boolean;
    /** Render a link (or router link) with button styling. */
    asChild?: boolean;
    ref?: Ref<HTMLButtonElement>;
    children?: ReactNode;
};
/** Server-compatible button. One quiet primary per view; everything else recedes. */
export declare function Button({ variant, size, shape, loading, asChild, className, type, disabled, onClick, children, ...rest }: ButtonProps): import("react").JSX.Element;
export type IconButtonProps = Omit<ButtonProps, "shape" | "children"> & {
    /** Required: an icon button has no visible text. */
    "aria-label": string;
    children: ReactNode;
};
/** A square button holding a single icon. */
export declare function IconButton({ className, variant, ...rest }: IconButtonProps): import("react").JSX.Element;
