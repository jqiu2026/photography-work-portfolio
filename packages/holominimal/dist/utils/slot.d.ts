import { type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from "react";
type AnyProps = Record<string, unknown>;
/**
 * Renders its only child with the slot's props merged in (class names joined, styles merged, handlers chained, refs
 * composed). This is what `asChild` uses, so a component can style a framework link (`next/link`, a router link)
 * without the library depending on any router.
 */
export declare function Slot({ children, ref, ...props }: HTMLAttributes<HTMLElement> & {
    children?: ReactNode;
    ref?: Ref<HTMLElement>;
}): ReactElement<AnyProps, string | import("react").JSXElementConstructor<any>> | null;
export {};
