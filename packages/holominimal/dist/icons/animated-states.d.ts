import type { IconProps } from "./icon";
type StateIconProps = Omit<IconProps, "animate" | "animateOn">;
/** Three lines that turn into a cross. */
export declare function MenuCloseIcon({ open, ...p }: StateIconProps & {
    open?: boolean;
}): import("react").JSX.Element;
/** A plus that turns into a cross (a quarter turn with a spring). */
export declare function PlusCloseIcon({ open, ...p }: StateIconProps & {
    open?: boolean;
}): import("react").JSX.Element;
/** A chevron that turns over: `down` points down when closed and up when open; `right` points right, then down. */
export declare function ChevronToggleIcon({ open, direction, ...p }: StateIconProps & {
    open?: boolean;
    direction?: "down" | "right";
}): import("react").JSX.Element;
/** A play triangle that becomes two pause bars (the shapes morph in browsers that animate path data). */
export declare function PlayPauseIcon({ playing, ...p }: StateIconProps & {
    playing?: boolean;
}): import("react").JSX.Element;
/** A circle and a check that draw themselves when `active` turns on. */
export declare function SuccessIcon({ active, ...p }: StateIconProps & {
    active?: boolean;
}): import("react").JSX.Element;
/** A circle and a cross that draw themselves, then shake. */
export declare function ErrorIcon({ active, ...p }: StateIconProps & {
    active?: boolean;
}): import("react").JSX.Element;
/** A heart that fills and pops when `liked`. */
export declare function LikeIcon({ liked, ...p }: StateIconProps & {
    liked?: boolean;
}): import("react").JSX.Element;
/** A star that fills and pops when `active`. */
export declare function StarToggleIcon({ active, ...p }: StateIconProps & {
    active?: boolean;
}): import("react").JSX.Element;
/** A bell that swings while `ringing`. */
export declare function BellRingIcon({ ringing, ...p }: StateIconProps & {
    ringing?: boolean;
}): import("react").JSX.Element;
/** Two sheets that become a check when `copied`. */
export declare function CopyCheckIcon({ copied, ...p }: StateIconProps & {
    copied?: boolean;
}): import("react").JSX.Element;
/** A speaker with sound waves; muting retracts the waves and draws a cross. `level` is 0 to 2 waves. */
export declare function VolumeToggleIcon({ muted, level, ...p }: StateIconProps & {
    muted?: boolean;
    level?: 0 | 1 | 2;
}): import("react").JSX.Element;
/** An eye that closes with a slash drawn across it when `hidden`. */
export declare function EyeToggleIcon({ hidden, ...p }: StateIconProps & {
    hidden?: boolean;
}): import("react").JSX.Element;
/** A padlock whose shackle lifts and swings open when `locked` is false. */
export declare function LockToggleIcon({ locked, ...p }: StateIconProps & {
    locked?: boolean;
}): import("react").JSX.Element;
/** Three dots that bounce in turn. A loader. */
export declare function DotsLoaderIcon(p: StateIconProps): import("react").JSX.Element;
/** Four bars that rise and fall like an equalizer. A loader, or "now playing". */
export declare function BarsLoaderIcon(p: StateIconProps): import("react").JSX.Element;
/** A ring with a travelling arc. A loader. */
export declare function RingLoaderIcon(p: StateIconProps): import("react").JSX.Element;
/** A dot with rings that ripple outward. A loader, or a live indicator. */
export declare function PulseLoaderIcon(p: StateIconProps): import("react").JSX.Element;
/** A dot orbiting a center. A loader. */
export declare function OrbitLoaderIcon(p: StateIconProps): import("react").JSX.Element;
/** Signal bars that climb in turn. A loader, or a connection meter. */
export declare function SignalLoaderIcon(p: StateIconProps): import("react").JSX.Element;
export {};
