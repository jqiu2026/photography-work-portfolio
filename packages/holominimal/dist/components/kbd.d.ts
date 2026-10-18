import type { HTMLAttributes } from "react";
/** A keyboard key cap: `<Kbd>⌘</Kbd><Kbd>K</Kbd>`. Server-compatible. */
export declare function Kbd({ className, ...rest }: HTMLAttributes<HTMLElement>): import("react").JSX.Element;
/** Several keys that are pressed together, joined by a quiet plus. */
export declare function KbdGroup({ className, ...rest }: HTMLAttributes<HTMLSpanElement>): import("react").JSX.Element;
