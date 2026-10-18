import { type ReactNode } from "react";
export type DataTableColumn<T> = {
    id: string;
    header: ReactNode;
    /** The sortable value; also the cell content when `cell` is not given. */
    accessor?: (row: T) => string | number | Date | boolean | null | undefined;
    /** Custom cell content. */
    cell?: (row: T) => ReactNode;
    sortable?: boolean;
    /** Right-aligned tabular figures. */
    numeric?: boolean;
    /** The cell that names the row (rendered as a row header). One per table. */
    rowHeader?: boolean;
};
export type DataTableProps<T> = {
    /** Names the table (its caption, visible to assistive technology). */
    caption: string;
    columns: DataTableColumn<T>[];
    rows: T[];
    /** A stable id for each row (needed for selection). */
    getRowId: (row: T) => string;
    /** Show a checkbox column. */
    selectable?: boolean;
    selected?: string[];
    defaultSelected?: string[];
    onSelectedChange?: (ids: string[]) => void;
    /** Rows per page; omit to show every row. */
    pageSize?: number;
    /** Initial sort: a column id and direction. */
    defaultSort?: {
        id: string;
        direction: "ascending" | "descending";
    };
    stickyHeader?: boolean;
    /** Shown when there are no rows. */
    empty?: ReactNode;
    className?: string;
};
/**
 * A complete data table from the library's parts: click a header to sort (ascending, descending, off), select rows with
 * checkboxes (a header checkbox selects the page), and page through with `Pagination`. Rows, columns and selection are
 * plain props; selection can be controlled.
 */
export declare function DataTable<T>({ caption, columns, rows, getRowId, selectable, selected, defaultSelected, onSelectedChange, pageSize, defaultSort, stickyHeader, empty, className, }: DataTableProps<T>): import("react").JSX.Element;
