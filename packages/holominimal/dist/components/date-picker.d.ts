import { type DateRange } from "./calendar";
type PickerBase = {
    /** Names the field when there is no visible label (or pass `id` and use `Field`). */
    "aria-label"?: string;
    id?: string;
    placeholder?: string;
    min?: Date;
    max?: Date;
    isDisabled?: (day: Date) => boolean;
    weekStartsOn?: 0 | 1;
    locale?: string;
    disabled?: boolean;
    className?: string;
    /** Format for the shown date. Default: a medium locale date. */
    format?: (date: Date) => string;
};
export type DatePickerProps = PickerBase & {
    value?: Date | null;
    defaultValue?: Date | null;
    onValueChange?: (value: Date | null) => void;
};
export type DateRangePickerProps = PickerBase & {
    value?: DateRange;
    defaultValue?: DateRange;
    onValueChange?: (value: DateRange) => void;
};
/** A field that opens a calendar in a popover. Picking a day closes it and returns focus to the field. */
export declare function DatePicker({ value: controlled, defaultValue, onValueChange, placeholder, format, min, max, isDisabled, weekStartsOn, locale, disabled, className, ...rest }: DatePickerProps): import("react").JSX.Element;
/** Two dates in one field: the first press sets the start, the second the end, then it closes. */
export declare function DateRangePicker({ value: controlled, defaultValue, onValueChange, placeholder, format, min, max, isDisabled, weekStartsOn, locale, disabled, className, ...rest }: DateRangePickerProps): import("react").JSX.Element;
export {};
