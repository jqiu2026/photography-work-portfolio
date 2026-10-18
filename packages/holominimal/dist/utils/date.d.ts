/** Small local-time date helpers for the calendar (no dependency, no time zones: a "day" is a local midnight). */
export declare const startOfDay: (d: Date) => Date;
export declare const addDays: (d: Date, n: number) => Date;
/** Adds months, clamping the day (Jan 31 + 1 month is Feb 28/29). */
export declare const addMonths: (d: Date, n: number) => Date;
export declare const startOfMonth: (d: Date) => Date;
export declare const isSameDay: (a?: Date | null, b?: Date | null) => boolean;
export declare const isSameMonth: (a: Date, b: Date) => boolean;
export declare const compareDays: (a: Date, b: Date) => number;
/** The weeks of a month as rows of 7 days, padded with the neighboring months' days. */
export declare function monthGrid(month: Date, weekStartsOn?: 0 | 1): Date[][];
