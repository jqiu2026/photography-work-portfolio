import { type HTMLAttributes } from "react";
export type DateRange = {
    from?: Date;
    to?: Date;
};
type Shared = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
    /** Earliest and latest selectable day. */
    min?: Date;
    max?: Date;
    /** Mark more days unavailable. */
    isDisabled?: (day: Date) => boolean;
    /** 0 = Sunday, 1 = Monday. Default 0. */
    weekStartsOn?: 0 | 1;
    locale?: string;
    /** The month shown first (and the day that takes focus). Default: the selection, else today. */
    defaultMonth?: Date;
};
export type CalendarProps = Shared & ({
    mode?: "single";
    value?: Date | null;
    defaultValue?: Date | null;
    onValueChange?: (value: Date | null) => void;
} | {
    mode: "range";
    value?: DateRange;
    defaultValue?: DateRange;
    onValueChange?: (value: DateRange) => void;
});
/**
 * A month grid for picking a day or a range. Arrows move by day and week, Home/End go to the week's ends, PageUp and
 * PageDown change month (with Shift, year), Enter or Space picks. Changing month slides the grid the way you are
 * heading; hovering a range preview is drawn as you move. Every day button has its full date as its name.
 */
export declare function Calendar(props: CalendarProps): import("react").JSX.Element;
export {};
