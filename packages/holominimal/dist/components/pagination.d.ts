import { type HTMLAttributes, type ReactNode } from "react";
/** Page numbers to show, with `"gap"` where pages are skipped: always the first, last, current and its siblings. */
export declare function paginationRange(page: number, pageCount: number, siblings?: number): Array<number | "gap">;
export type PaginationProps = Omit<HTMLAttributes<HTMLElement>, "onChange"> & {
    page: number;
    pageCount: number;
    onPageChange?: (page: number) => void;
    /** Make each page a real link (for server-rendered or router pages). Takes precedence over buttons. */
    getHref?: (page: number) => string;
    /** Page numbers shown on each side of the current one. Default 1. */
    siblings?: number;
    previousLabel?: ReactNode;
    nextLabel?: ReactNode;
};
/** Previous, numbered pages with gaps, and next. Buttons by default, links with `getHref`. The current-page highlight slides between pages. */
export declare function Pagination({ page, pageCount, onPageChange, getHref, siblings, previousLabel, nextLabel, className, ...rest }: PaginationProps): import("react").JSX.Element;
