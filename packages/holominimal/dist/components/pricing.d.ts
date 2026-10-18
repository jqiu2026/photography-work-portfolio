import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { type SurfaceProps } from "./surface";
/** Package/plan cards side by side (a <ul>). */
export declare function PricingGrid({ className, ...rest }: HTMLAttributes<HTMLUListElement>): import("react").JSX.Element;
export type PricingCardProps = Omit<SurfaceProps, "selected"> & {
    /** The recommended package: a thin iridescent edge and an optional label. */
    featured?: boolean;
    /** Label shown on a featured card ("Most chosen"). */
    featuredLabel?: ReactNode;
    /** The plan the viewer is on: a brighter hairline. */
    current?: boolean;
};
/**
 * A package or plan. Outlined by default; featured cards get the iridescent edge rather than a fill, so the grid keeps
 * one material.
 */
export declare function PricingCard({ featured, featuredLabel, current, variant, as, padding, className, children, ...rest }: PricingCardProps): import("react").JSX.Element;
export declare function PricingName({ as: As, className, ...rest }: HTMLAttributes<HTMLHeadingElement> & {
    as?: ElementType;
}): import("react").JSX.Element;
export declare function PricingTagline({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>): import("react").JSX.Element;
export type PricingPriceProps = HTMLAttributes<HTMLParagraphElement> & {
    /** "per session", "/ month". */
    period?: ReactNode;
};
export declare function PricingPrice({ period, className, children, ...rest }: PricingPriceProps): import("react").JSX.Element;
/** What is included, as label / value rows on hairlines. */
export declare function PricingFeatures({ className, ...rest }: HTMLAttributes<HTMLUListElement>): import("react").JSX.Element;
export declare function PricingFeature({ value, className, children, ...rest }: HTMLAttributes<HTMLLIElement> & {
    value?: ReactNode;
}): import("react").JSX.Element;
export declare function PricingFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
