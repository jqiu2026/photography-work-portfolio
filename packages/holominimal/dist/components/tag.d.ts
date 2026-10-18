import type { HTMLAttributes, MouseEvent } from "react";
import type { Tone } from "./badge";
export type TagProps = HTMLAttributes<HTMLSpanElement> & {
    tone?: Extract<Tone, "neutral" | "accent" | "success" | "warning" | "danger">;
    /** Adds a remove button. */
    onRemove?: (event: MouseEvent<HTMLButtonElement>) => void;
    /** Accessible name of the remove button. Default "Remove". */
    removeLabel?: string;
};
/** A removable label or filter chip. Unlike `Badge` it can be dismissed. */
export declare function Tag({ tone, onRemove, removeLabel, className, children, ...rest }: TagProps): import("react").JSX.Element;
