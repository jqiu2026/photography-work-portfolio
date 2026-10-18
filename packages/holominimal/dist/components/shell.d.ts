import type { HTMLAttributes, ReactNode } from "react";
export type AppShellProps = HTMLAttributes<HTMLDivElement> & {
    /** Usually a <Dock placement="fixed">. */
    sidebar?: ReactNode;
    /** Quick tools pinned top-right (search, a primary action). Moves to the bottom on small screens. */
    toolbar?: ReactNode;
    /** Accessible name of the toolbar region. Default "Page tools". */
    toolbarLabel?: string;
    /** Which edge the sidebar is on, so the stage clears it. Match the Dock's `side`. Default `left`. */
    sidebarSide?: "left" | "right";
    /** Optional backdrop (an <Atmosphere />). */
    backdrop?: ReactNode;
    /** One-time arrival choreography: a black curtain lifts, the dock slides in, the page rises. */
    entrance?: "none" | "curtain" | "fade";
    /** id of the <main> landmark, for the skip link. */
    mainId?: string;
    children: ReactNode;
};
/** Page frame: sidebar, toolbar, and a main stage that clears the sidebar. Server-compatible. */
export declare function AppShell({ sidebar, toolbar, toolbarLabel, backdrop, sidebarSide, entrance, mainId, className, children, ...rest }: AppShellProps): import("react").JSX.Element;
export type PageProps = HTMLAttributes<HTMLDivElement> & {
    /** Content width: `content` (62rem, the studio column) or `wide`. */
    width?: "content" | "wide";
};
/** The page column inside the stage: the studio's measured width and vertical rhythm. */
export declare function Page({ width, className, ...rest }: PageProps): import("react").JSX.Element;
/**
 * A deep-space backdrop with a deliberate composition: a violet-to-cyan nebula on the diagonal, a calm center, and
 * two star layers. It drifts very slowly and shifts a few pixels against the pointer (fed by `LightField`), and holds
 * still under reduced motion. Server-compatible.
 */
export declare function Atmosphere({ className, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
