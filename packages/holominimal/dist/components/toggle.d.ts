import { type ButtonHTMLAttributes, type HTMLAttributes } from "react";
export type ToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
    pressed?: boolean;
    defaultPressed?: boolean;
    onPressedChange?: (pressed: boolean) => void;
    size?: "sm" | "md";
};
/** A button that stays pressed (bold, mute, favorite). Pressed state is `aria-pressed`. */
export declare function Toggle({ pressed: controlled, defaultPressed, onPressedChange, size, className, onClick, ...rest }: ToggleProps): import("react").JSX.Element;
type GroupBase = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
    "aria-label": string;
    size?: "sm" | "md";
};
export type ToggleGroupProps = GroupBase & ({
    type?: "single";
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
} | {
    type: "multiple";
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
});
/**
 * Related toggles in one hairline group. `single` behaves like a toolbar choice that can be cleared; `multiple` is for
 * independent formatting switches. For a required single choice use `SegmentedControl`.
 */
export declare function ToggleGroup(props: ToggleGroupProps): import("react").JSX.Element;
export declare function ToggleGroupItem({ value, className, onClick, ...rest }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
    value: string;
}): import("react").JSX.Element;
export {};
