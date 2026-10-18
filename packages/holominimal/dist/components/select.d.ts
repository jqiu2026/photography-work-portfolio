import { type ButtonHTMLAttributes, type ReactNode } from "react";
export type SelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
    description?: string;
};
export type SelectProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "defaultValue" | "onChange" | "children"> & {
    /** The choices, as data. Or pass `<option value="x">Label</option>` children, as with a native select. */
    options?: SelectOption[];
    children?: ReactNode;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Shown when nothing is chosen. */
    placeholder?: string;
    /** Posts the value with a form. */
    name?: string;
};
/**
 * A custom single-choice dropdown (not the browser's native menu): the same look, motion and keyboard behavior as the
 * rest of the set. It is the select-only combobox pattern: focus stays on the button while Up and Down move the
 * highlight (`aria-activedescendant`), Enter or Space chooses, Escape closes, and typing jumps to a match. Use
 * `Combobox` when people need to search.
 */
export declare function Select({ options: given, children, value: controlled, defaultValue, onValueChange, placeholder, name, disabled, className, id, onKeyDown, ...rest }: SelectProps): import("react").JSX.Element;
