import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
export type TableProps = HTMLAttributes<HTMLTableElement> & {
    /** Keep the header row in view while the table scrolls inside its container. */
    stickyHeader?: boolean;
    /** Accessible name of the scroll container (the table needs a `TableCaption` or `aria-label` too). */
    containerLabel?: string;
    containerClassName?: string;
};
/**
 * A hairline-row table. It sits in a horizontally scrollable, keyboard-focusable container so wide tables never break
 * the page layout. Server-compatible: sorting is just a prop on `TableHead`.
 */
export declare function Table({ stickyHeader, containerLabel, containerClassName, className, ...rest }: TableProps): import("react").JSX.Element;
export declare function TableCaption({ className, ...rest }: HTMLAttributes<HTMLTableCaptionElement>): import("react").JSX.Element;
export declare function TableHeader(props: HTMLAttributes<HTMLTableSectionElement>): import("react").JSX.Element;
export declare function TableBody(props: HTMLAttributes<HTMLTableSectionElement>): import("react").JSX.Element;
export declare function TableRow({ selected, className, ...rest }: HTMLAttributes<HTMLTableRowElement> & {
    selected?: boolean;
}): import("react").JSX.Element;
export type TableHeadProps = Omit<ThHTMLAttributes<HTMLTableCellElement>, "align"> & {
    align?: "start" | "end";
    /** Makes the header a sort button. Pass the current direction; the handler should cycle it. */
    sort?: "ascending" | "descending" | "none";
    onSort?: () => void;
};
export declare function TableHead({ align, sort, onSort, className, children, ...rest }: TableHeadProps): import("react").JSX.Element;
export type TableCellProps = Omit<TdHTMLAttributes<HTMLTableCellElement>, "align"> & {
    align?: "start" | "end";
    /** Tabular figures, for amounts and counts. */
    numeric?: boolean;
    /** Render as a row header (`th scope="row"`), for the cell that names the row. */
    rowHeader?: boolean;
};
export declare function TableCell({ align, numeric, rowHeader, className, ...rest }: TableCellProps): import("react").JSX.Element;
