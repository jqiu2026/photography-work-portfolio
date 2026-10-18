import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
export type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
    /** Controlled selected value. */
    value?: string;
    /** Uncontrolled initial value. */
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    orientation?: "horizontal" | "vertical";
    children: ReactNode;
};
/**
 * Tabs that switch panels in place (a gallery workspace: Photos, Design, Share). ARIA tablist with roving focus:
 * arrows move and select, Home/End jump. For links between pages use PageTabs.
 */
export declare function Tabs({ value: controlled, defaultValue, onValueChange, orientation, className, children, ...rest }: TabsProps): import("react").JSX.Element;
export type TabListProps = HTMLAttributes<HTMLDivElement> & {
    "aria-label": string;
    /** `underline`: text tabs on a hairline (default). `pill`: quiet pills, for short filter-like sets. */
    variant?: "underline" | "pill";
};
export declare function TabList({ variant, className, onKeyDown, ...rest }: TabListProps): import("react").JSX.Element;
export type TabProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
    value: string;
};
export declare function Tab({ value, className, onClick, ...rest }: TabProps): import("react").JSX.Element;
export type TabPanelProps = HTMLAttributes<HTMLDivElement> & {
    value: string;
    /** Keep the panel mounted (hidden) when not selected, preserving its state. */
    keepMounted?: boolean;
};
export declare function TabPanel({ value, keepMounted, className, children, ...rest }: TabPanelProps): import("react").JSX.Element | null;
