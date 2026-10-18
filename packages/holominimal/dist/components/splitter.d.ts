import { type HTMLAttributes, type ReactNode } from "react";
export type SplitterProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
    direction?: "horizontal" | "vertical";
    /** Starting sizes in percent, one per panel. Default: equal. */
    defaultSizes?: number[];
    /** Controlled sizes in percent. */
    sizes?: number[];
    onSizesChange?: (sizes: number[]) => void;
    /** Smallest size of any panel, percent. Default 10. */
    minSize?: number;
    /** Panels (`SplitterPanel`). Draggable handles are placed between them. */
    children: ReactNode;
};
export type SplitterPanelProps = HTMLAttributes<HTMLDivElement>;
export declare function SplitterPanel({ className, ...rest }: SplitterPanelProps): import("react").JSX.Element;
/**
 * Resizable panels. Each handle is a focusable `role="separator"`: drag it, or use the arrow keys (Shift for bigger
 * steps), Home and End. Sizes are percentages and the layout follows the pointer with no easing, so dragging never lags.
 */
export declare function Splitter({ direction, defaultSizes, sizes: controlled, onSizesChange, minSize, className, style, children, ...rest }: SplitterProps): import("react").JSX.Element;
