import type { HTMLAttributes, ReactNode } from "react";
export type ToolbarProps = HTMLAttributes<HTMLDivElement> & {
    /** Names the toolbar for assistive technology. */
    "aria-label": string;
    /** Content pushed to the far end (a count, a button). */
    end?: ReactNode;
};
/**
 * A filter bar: a search field, selects and toggles in one wrapping row, with an optional trailing slot. Put the
 * controls in as children (`Input`, `Select`, `SegmentedControl`, `Button`).
 */
export declare function Toolbar({ end, className, children, ...rest }: ToolbarProps): import("react").JSX.Element;
export type SettingsSectionProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
    title: ReactNode;
    description?: ReactNode;
    /** The heading element of the title (`2` to `6`), so it follows the page's outline. Default 2. */
    level?: 2 | 3 | 4 | 5 | 6;
};
/** A titled group of settings rows, divided by hairlines. */
export declare function SettingsSection({ title, description, level, className, children, ...rest }: SettingsSectionProps): import("react").JSX.Element;
export type SettingsRowProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
    title: ReactNode;
    description?: ReactNode;
    /** The control (a switch, select, button) at the end of the row. */
    control: ReactNode;
};
/** One setting: its name and explanation on the left, the control on the right (stacked on phones). */
export declare function SettingsRow({ title, description, control, className, ...rest }: SettingsRowProps): import("react").JSX.Element;
