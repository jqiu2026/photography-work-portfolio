import { type ButtonHTMLAttributes, type HTMLAttributes } from "react";
type Common = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
    /** Heading level of each trigger's wrapper, for the page outline. Default 3. */
    headingLevel?: 2 | 3 | 4;
};
export type AccordionProps = Common & ({
    type?: "single";
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    collapsible?: boolean;
} | {
    type: "multiple";
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    collapsible?: never;
});
/**
 * Stacked sections that open one at a time (`type="single"`, collapsible by default) or independently
 * (`type="multiple"`). Up/Down, Home and End move between the headers. Each panel animates its height.
 */
export declare function Accordion(props: AccordionProps): import("react").JSX.Element;
export type AccordionItemProps = HTMLAttributes<HTMLDivElement> & {
    value: string;
    disabled?: boolean;
};
export declare function AccordionItem({ value, disabled, className, ...rest }: AccordionItemProps): import("react").JSX.Element;
export declare function AccordionTrigger({ className, children, onClick, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>): import("react").JSX.Element;
export declare function AccordionContent({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
export {};
