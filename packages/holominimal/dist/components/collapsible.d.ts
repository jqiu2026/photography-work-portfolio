import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
export type CollapsibleProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: ReactNode;
};
/** One region that opens and closes. The content animates its height and stays mounted, so its state is kept. */
export declare function Collapsible({ open: controlled, defaultOpen, onOpenChange, className, children, ...rest }: CollapsibleProps): import("react").JSX.Element;
export declare function CollapsibleTrigger({ asChild, onClick, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
}): import("react").JSX.Element;
export declare function CollapsibleContent({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
