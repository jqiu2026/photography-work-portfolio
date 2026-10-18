import { type InputHTMLAttributes, type ReactElement, type ReactNode, type Ref, type TextareaHTMLAttributes } from "react";
export type FieldProps = {
    label: ReactNode;
    /** Help under the control. */
    hint?: ReactNode;
    /** Validation message; marks the control aria-invalid and announces it. */
    error?: ReactNode;
    /** Visually hide the label (it is still the accessible name). */
    hideLabel?: boolean;
    /** Control id; generated when omitted. */
    id?: string;
    className?: string;
    /** Exactly one control (Input, Select, Textarea...). */
    children: ReactElement;
};
/**
 * Label, control, hint and error, wired together (id, aria-describedby, aria-invalid). Server-compatible: it clones
 * its one control rather than using context.
 */
export declare function Field({ label, hint, error, hideLabel, id, className, children }: FieldProps): import("react").JSX.Element;
export declare function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement> & {
    ref?: Ref<HTMLInputElement>;
}): import("react").JSX.Element;
export declare function Textarea({ autoGrow, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & {
    ref?: Ref<HTMLTextAreaElement>;
    /** Grow with the content (CSS `field-sizing`; browsers without it keep a fixed, resizable box). */
    autoGrow?: boolean;
}): import("react").JSX.Element;
export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    label: ReactNode;
    /** `switch` renders a toggle (role="switch") for settings that apply at once. */
    appearance?: "checkbox" | "switch";
    /** Visually hide the label (it is still the accessible name), as in a settings row that already shows it. */
    hideLabel?: boolean;
    ref?: Ref<HTMLInputElement>;
};
/** Native checkbox with its label; `appearance="switch"` for immediate settings. */
export declare function Checkbox({ label, appearance, hideLabel, className, ...rest }: CheckboxProps): import("react").JSX.Element;
