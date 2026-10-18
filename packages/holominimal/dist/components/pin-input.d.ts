import { type HTMLAttributes } from "react";
export type PinInputProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
    /** Names the field (e.g. "Verification code"). Each box is announced as "digit N of M". */
    "aria-label": string;
    length?: number;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Called once every box is filled. */
    onComplete?: (value: string) => void;
    type?: "numeric" | "alphanumeric";
    /** Hide the characters, like a password. */
    mask?: boolean;
    disabled?: boolean;
    invalid?: boolean;
};
/** A one-time-code field of separate boxes: typing advances, Backspace goes back, arrows move, paste fills them all. */
export declare function PinInput({ length, value: controlled, defaultValue, onValueChange, onComplete, type, mask, disabled, invalid, className, ...rest }: PinInputProps): import("react").JSX.Element;
