import { type ReactNode } from "react";
import type { Tone } from "./badge";
export type ToastOptions = {
    title: string;
    description?: string;
    tone?: Extract<Tone, "neutral" | "info" | "success" | "warning" | "danger">;
    /** Milliseconds before it leaves. `0` keeps it until dismissed. Default 5000. */
    duration?: number;
    /** One quiet action, such as "Undo". The toast is dismissed after it runs. */
    action?: {
        label: string;
        onClick: () => void;
    };
};
type ToastApi = {
    toast: (options: ToastOptions) => string;
    dismiss: (id?: string) => void;
};
/** Raises toasts from any client component under `ToastProvider`. */
export declare function useToast(): ToastApi;
export type ToastProviderProps = {
    children: ReactNode;
    /** Most toasts shown at once; the oldest leaves first. Default 4. */
    limit?: number;
    /** Where the stack sits. Default `bottom-right`. */
    position?: "bottom-right" | "bottom-center" | "top-right";
    /** Accessible name of the notifications region. */
    label?: string;
};
/**
 * A queue of transient messages in a polite live region. The stack lives in the top layer, so it stays above open
 * dialogs. Timers pause while the pointer or keyboard focus is inside the stack, and Escape clears it.
 */
export declare function ToastProvider({ children, limit, position, label, }: ToastProviderProps): import("react").JSX.Element;
export {};
