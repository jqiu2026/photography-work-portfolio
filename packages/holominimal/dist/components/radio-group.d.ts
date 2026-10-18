import { type FieldsetHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
export type RadioGroupProps = Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange" | "defaultValue"> & {
    /** The group's visible name (a `legend`). */
    legend: ReactNode;
    hideLegend?: boolean;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    name?: string;
    orientation?: "vertical" | "horizontal";
};
/**
 * A single choice from a few options, on native radio inputs: the browser provides arrow-key movement, a single tab
 * stop and form submission. Use `SegmentedControl` for view filters and `Select` for long lists.
 */
export declare function RadioGroup({ legend, hideLegend, value: controlled, defaultValue, onValueChange, name, orientation, disabled, className, children, ...rest }: RadioGroupProps): import("react").JSX.Element;
export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "name" | "checked" | "defaultChecked" | "value"> & {
    value: string;
    label: ReactNode;
    /** Secondary text under the label, linked with aria-describedby. */
    description?: ReactNode;
};
export declare function Radio({ value, label, description, className, onChange, id, ...rest }: RadioProps): import("react").JSX.Element;
