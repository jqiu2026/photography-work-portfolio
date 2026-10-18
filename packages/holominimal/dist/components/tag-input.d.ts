export type TagInputProps = {
    "aria-label"?: string;
    id?: string;
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    placeholder?: string;
    /** Reject a tag (return false). Duplicates are always ignored. */
    validate?: (tag: string) => boolean;
    /** Keys that commit the text as a tag besides Enter. Default `[","]`. */
    separators?: string[];
    max?: number;
    disabled?: boolean;
    className?: string;
};
/** Free-form tags: type and press Enter or a comma, paste a list, Backspace removes the last. */
export declare function TagInput({ value: controlled, defaultValue, onValueChange, placeholder, validate, separators, max, disabled, className, id, ...rest }: TagInputProps): import("react").JSX.Element;
