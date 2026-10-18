import type { HTMLAttributes } from "react";
export type SeparatorProps = HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
    /** Purely visual (no semantics). Default true; set false when the line separates meaningful groups. */
    decorative?: boolean;
};
/** A hairline between groups. Server-compatible. */
export declare function Separator({ orientation, decorative, className, ...rest }: SeparatorProps): import("react").JSX.Element;
