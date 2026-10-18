import type { HTMLAttributes, LiHTMLAttributes, ReactNode } from "react";
/** Rows separated by hairlines: upcoming appointments, recent activity, needs-attention. */
export declare function DataList({ className, ...rest }: HTMLAttributes<HTMLUListElement>): import("react").JSX.Element;
export type DataListItemProps = LiHTMLAttributes<HTMLLIElement> & {
    /** Secondary line under the primary content. */
    description?: ReactNode;
    /** Right-aligned meta: a time, an amount, a status. */
    meta?: ReactNode;
    /** Row actions, revealed on hover/focus with a fine pointer, always visible on touch. */
    actions?: ReactNode;
};
export declare function DataListItem({ description, meta, actions, className, children, ...rest }: DataListItemProps): import("react").JSX.Element;
/** A centered, quiet message for an empty list or section. */
export declare function EmptyState({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>): import("react").JSX.Element;
