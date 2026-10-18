import { type InputHTMLAttributes } from "react";
export type ComboboxOption = {
    value: string;
    label: string;
    /** Secondary text, matched by the filter. */
    description?: string;
    disabled?: boolean;
};
type Shared = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "type" | "role" | "size" | "multiple"> & {
    options: ComboboxOption[];
    placeholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    /** Replace the default filter (a case-insensitive match on label and description). */
    filter?: (option: ComboboxOption, query: string) => boolean;
};
export type ComboboxProps = Shared & ({
    multiple?: false;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
} | {
    multiple: true;
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
});
/**
 * A text field with a filtered list of options (ARIA combobox: focus stays in the input, Up/Down move the highlight
 * with `aria-activedescendant`, Enter picks, Escape closes). Single choice shows the label in the field; `multiple`
 * shows each choice as a removable tag and Backspace removes the last. Use `Select` for a short list without search.
 */
export declare function Combobox(props: ComboboxProps): import("react").JSX.Element;
export {};
