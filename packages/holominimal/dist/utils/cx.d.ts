/** Joins class names, skipping falsy values. */
export declare function cx(...parts: Array<string | false | null | undefined>): string;
/** `data-*` boolean attributes: present (empty string) when true, absent otherwise. */
export declare const flag: (on: boolean | undefined) => "" | undefined;
