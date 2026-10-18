import type { HTMLAttributes } from "react";
import type { Tone } from "./badge";
export type AlertProps = HTMLAttributes<HTMLDivElement> & {
    tone?: Extract<Tone, "neutral" | "info" | "success" | "warning" | "danger">;
};
/**
 * An inline message that stays in the page flow: a hairline box with a toned edge. Warnings and errors use
 * `role="alert"` (announced at once); the rest use `role="status"`. Server-compatible.
 */
export declare function Alert({ tone, role, className, ...rest }: AlertProps): import("react").JSX.Element;
export declare function AlertTitle({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>): import("react").JSX.Element;
export declare function AlertDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>): import("react").JSX.Element;
