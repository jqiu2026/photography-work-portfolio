import type { ComponentProps } from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "./dialog";
/** A side sheet: the `Dialog` (native modal, focus trap, Escape) presented as a panel from an edge. */
export declare const Drawer: typeof Dialog;
export declare const DrawerTrigger: typeof DialogTrigger;
export declare const DrawerTitle: typeof DialogTitle;
export declare const DrawerDescription: typeof DialogDescription;
export declare const DrawerFooter: typeof DialogFooter;
export declare const DrawerClose: typeof DialogClose;
export type DrawerContentProps = Omit<ComponentProps<typeof DialogContent>, "position"> & {
    /** The edge it slides from. Default `right`. */
    side?: "left" | "right" | "bottom";
};
export declare function DrawerContent({ side, ...rest }: DrawerContentProps): import("react").JSX.Element;
