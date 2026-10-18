import type { HTMLAttributes, LiHTMLAttributes, ReactNode } from "react";
/** A vertical sequence of events on a hairline. Server-compatible. */
export declare function Timeline({ className, ...rest }: HTMLAttributes<HTMLOListElement>): import("react").JSX.Element;
export type TimelineItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, "title"> & {
    title: ReactNode;
    /** When it happened (a `<time>` is ideal). */
    time?: ReactNode;
    description?: ReactNode;
    status?: "done" | "current" | "upcoming";
    /** Replace the dot (an icon or an Avatar). */
    marker?: ReactNode;
};
export declare function TimelineItem({ title, time, description, status, marker, className, children, ...rest }: TimelineItemProps): import("react").JSX.Element;
