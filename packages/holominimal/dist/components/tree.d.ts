import { type HTMLAttributes, type ReactNode } from "react";
export type TreeNode = {
    id: string;
    label: ReactNode;
    children?: TreeNode[];
    disabled?: boolean;
    /** Leading icon. */
    icon?: ReactNode;
};
export type TreeProps = Omit<HTMLAttributes<HTMLUListElement>, "onSelect" | "children"> & {
    "aria-label": string;
    nodes: TreeNode[];
    selected?: string | null;
    defaultSelected?: string | null;
    /** Called with the new selection when it changes (not when the selected node is chosen again). */
    onSelectedChange?: (id: string) => void;
    expanded?: string[];
    defaultExpanded?: string[];
    onExpandedChange?: (ids: string[]) => void;
};
/**
 * A hierarchy (folders, galleries within clients). ARIA tree with one tab stop: Up and Down move, Right opens or
 * steps into a branch, Left closes or steps out, Home and End jump, Enter or Space selects. Branches open with an
 * animated height.
 */
export declare function Tree({ nodes, selected: controlledSelected, defaultSelected, onSelectedChange, expanded: controlledExpanded, defaultExpanded, onExpandedChange, className, onKeyDown, ...rest }: TreeProps): import("react").JSX.Element;
