import { type HTMLAttributes, type ReactNode } from "react";
export type FileRejection = {
    file: File;
    reason: "type" | "size" | "count";
};
export type FileDropzoneProps = Omit<HTMLAttributes<HTMLDivElement>, "onDrop" | "onChange"> & {
    /** Called with the accepted files (from a drop or the file dialog). */
    onFiles: (files: File[]) => void;
    /** Called with files that were refused, and why. */
    onReject?: (rejections: FileRejection[]) => void;
    /** As the `accept` attribute: ".jpg,.png" or "image/*". */
    accept?: string;
    multiple?: boolean;
    /** Largest file, bytes. */
    maxSize?: number;
    /** Most files per drop. */
    maxFiles?: number;
    disabled?: boolean;
    /** The main line. Default "Drop files here, or browse". */
    label?: ReactNode;
    /** The second line (formats and limits). */
    description?: ReactNode;
    name?: string;
};
/**
 * A drop target and file picker in one: drag files over it (it responds), or activate it with the keyboard to open the
 * file dialog. Files are validated against `accept`, `maxSize` and `maxFiles`; the rest are reported to `onReject`.
 */
export declare function FileDropzone({ onFiles, onReject, accept, multiple, maxSize, maxFiles, disabled, label, description, name, className, ...rest }: FileDropzoneProps): import("react").JSX.Element;
export type FileItemProps = HTMLAttributes<HTMLLIElement> & {
    name: string;
    /** Bytes. */
    size?: number;
    /** 0 to 100 while uploading; omit when idle. */
    progress?: number;
    status?: "ready" | "uploading" | "done" | "error";
    error?: ReactNode;
    onRemove?: () => void;
};
/** One row of an upload list: name, size, a progress bar while it uploads, and a remove button. */
export declare function FileItem({ name, size, progress, status, error, onRemove, className, ...rest }: FileItemProps): import("react").JSX.Element;
