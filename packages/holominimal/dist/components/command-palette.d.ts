export type CommandItem = {
    id: string;
    label: string;
    /** Shown beside the label and matched by the filter. */
    group?: string;
    /** Extra words the filter matches. */
    keywords?: string;
    disabled?: boolean;
};
export type CommandPaletteProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: CommandItem[];
    /** Called with the chosen item. The palette closes afterwards. */
    onSelect: (item: CommandItem) => void;
    /** Accessible name of the dialog. */
    label?: string;
    placeholder?: string;
    emptyMessage?: string;
    /** Open on Cmd/Ctrl+K (and close on it again). Opt-in so a host app keeps control of its shortcuts. */
    shortcut?: boolean;
    /** Replace the default case-insensitive substring filter. */
    filter?: (item: CommandItem, query: string) => boolean;
    className?: string;
};
/**
 * A searchable list of actions or destinations in a top-positioned dialog. The input is a combobox: focus stays in it
 * while Up/Down move the highlighted option (`aria-activedescendant`), Enter chooses it, Escape closes.
 */
export declare function CommandPalette({ open, onOpenChange, items, onSelect, label, placeholder, emptyMessage, shortcut, filter, className, }: CommandPaletteProps): import("react").JSX.Element;
