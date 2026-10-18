import { type HTMLAttributes, type LiHTMLAttributes, type ReactNode } from "react";
export type StepperProps = HTMLAttributes<HTMLOListElement> & {
    /** Zero-based index of the current step. Earlier steps are complete, later ones upcoming. */
    current: number;
    orientation?: "horizontal" | "vertical";
};
/** A sequence of steps. Status is derived from `current`, so children are just `Step`s. Server-compatible. */
export declare function Stepper({ current, orientation, className, children, ...rest }: StepperProps): import("react").JSX.Element;
export type StepProps = LiHTMLAttributes<HTMLLIElement> & {
    title: ReactNode;
    description?: ReactNode;
};
export declare function Step({ title, description, className, ...rest }: StepProps): import("react").JSX.Element;
