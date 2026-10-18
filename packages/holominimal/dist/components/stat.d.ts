import type { HTMLAttributes, ReactNode } from "react";
/** A row of key figures divided by hairlines (stacks on phones). Renders a <dl>. */
export declare function StatGroup({ className, ...rest }: HTMLAttributes<HTMLDListElement>): import("react").JSX.Element;
export type StatProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    label: ReactNode;
    value: ReactNode;
    /** One line of context under the figure ("Up 12% on the 30 days before"). */
    detail?: ReactNode;
    /** Colors the detail: `up` is good news, `down` bad, `neutral` (default) informational. */
    trend?: "up" | "down" | "neutral";
};
export declare function Stat({ label, value, detail, trend, className, ...rest }: StatProps): import("react").JSX.Element;
