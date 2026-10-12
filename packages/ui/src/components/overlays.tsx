"use client";

import {
  Accordion as RAccordion,
  DropdownMenu as RMenu,
  Popover as RPopover,
  Tabs as RTabs,
  Tooltip as RTooltip,
  Dialog as RDialog,
} from "radix-ui";
import { ChevronDown, X } from "lucide-react";
import { createContext, useCallback, useContext, useState, type HTMLAttributes, type ReactNode } from "react";
import { cx } from "./cx";

/* Dialog + Sheet */
type DialogProps = {
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
};
export function Dialog({ trigger, title, description, children, ...root }: DialogProps) {
  return (
    <RDialog.Root {...root}>
      {trigger ? <RDialog.Trigger asChild>{trigger}</RDialog.Trigger> : null}
      <RDialog.Portal>
        <RDialog.Overlay className="ph-overlay" />
        <RDialog.Content className="ph-dialog" aria-describedby={description ? undefined : undefined}>
          <RDialog.Title className="ph-dialog__title">{title}</RDialog.Title>
          {description ? <RDialog.Description className="ph-dialog__desc">{description}</RDialog.Description> : null}
          {children}
          <RDialog.Close className="ph-dialog__close" aria-label="Close">
            <X size={18} aria-hidden />
          </RDialog.Close>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

export function Sheet({
  trigger,
  title,
  side = "right",
  children,
  ...root
}: Omit<DialogProps, "description"> & { side?: "left" | "right" | "bottom" }) {
  return (
    <RDialog.Root {...root}>
      {trigger ? <RDialog.Trigger asChild>{trigger}</RDialog.Trigger> : null}
      <RDialog.Portal>
        <RDialog.Overlay className="ph-overlay" />
        <RDialog.Content className={cx("ph-sheet", `ph-sheet--${side}`)} aria-describedby={undefined}>
          <RDialog.Title className="ph-dialog__title">{title}</RDialog.Title>
          {children}
          <RDialog.Close className="ph-dialog__close" aria-label="Close">
            <X size={18} aria-hidden />
          </RDialog.Close>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

export const DialogClose = RDialog.Close;

/* Popover, Tooltip, Menu */
export function Popover({
  trigger,
  children,
  align = "start",
}: { trigger: ReactNode; children: ReactNode; align?: "start" | "center" | "end" }) {
  return (
    <RPopover.Root>
      <RPopover.Trigger asChild>{trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content className="ph-popover" align={align} sideOffset={10}>
          {children}
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  );
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <RTooltip.Provider delayDuration={250}>{children}</RTooltip.Provider>;
}
export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <RTooltip.Root>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content className="ph-tooltip" sideOffset={8}>
          {content}
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  );
}

export type MenuItem = { label: string; onSelect?: () => void; href?: string; destructive?: boolean };
export function Menu({
  trigger,
  items,
  align = "end",
}: { trigger: ReactNode; items: MenuItem[]; align?: "start" | "center" | "end" }) {
  return (
    <RMenu.Root>
      <RMenu.Trigger asChild>{trigger}</RMenu.Trigger>
      <RMenu.Portal>
        <RMenu.Content className="ph-popover ph-menu" align={align} sideOffset={10}>
          {items.map((it) => (
            <RMenu.Item
              key={it.label}
              className={cx("ph-menu__item", it.destructive && "ph-menu__item--danger")}
              onSelect={it.onSelect}
              asChild={!!it.href}
            >
              {it.href ? <a href={it.href}>{it.label}</a> : it.label}
            </RMenu.Item>
          ))}
        </RMenu.Content>
      </RMenu.Portal>
    </RMenu.Root>
  );
}

/* Tabs, Accordion */
export function Tabs({
  tabs,
  defaultValue,
  className,
}: { tabs: { value: string; label: string; content: ReactNode }[]; defaultValue?: string; className?: string }) {
  return (
    <RTabs.Root defaultValue={defaultValue ?? tabs[0]?.value} className={cx("ph-tabs", className)}>
      <RTabs.List className="ph-tabs__list">
        {tabs.map((t) => (
          <RTabs.Trigger key={t.value} value={t.value} className="ph-tabs__tab">
            {t.label}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {tabs.map((t) => (
        <RTabs.Content key={t.value} value={t.value} className="ph-tabs__panel">
          {t.content}
        </RTabs.Content>
      ))}
    </RTabs.Root>
  );
}

export function Accordion({
  items,
  type = "single",
  className,
}: {
  items: { value: string; title: string; content: ReactNode }[];
  type?: "single" | "multiple";
  className?: string;
}) {
  const props = type === "single" ? ({ type: "single", collapsible: true } as const) : ({ type: "multiple" } as const);
  return (
    <RAccordion.Root className={cx("ph-accordion", className)} {...props}>
      {items.map((i) => (
        <RAccordion.Item key={i.value} value={i.value} className="ph-accordion__item">
          <RAccordion.Header asChild>
            <h3>
              <RAccordion.Trigger className="ph-accordion__trigger">
                {i.title}
                <ChevronDown size={18} aria-hidden />
              </RAccordion.Trigger>
            </h3>
          </RAccordion.Header>
          <RAccordion.Content className="ph-accordion__content">
            <div>{i.content}</div>
          </RAccordion.Content>
        </RAccordion.Item>
      ))}
    </RAccordion.Root>
  );
}

/* Toast: minimal, polite live region */
type ToastItem = { id: number; message: string; tone?: "default" | "success" | "danger" };
const ToastCtx = createContext<{ toast: (message: string, tone?: ToastItem["tone"]) => void } | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string, tone: ToastItem["tone"] = "default") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, message, tone }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 5000);
  }, []);
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="ph-toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx("ph-toast", `ph-toast--${t.tone}`)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error("useToast must be used inside <ToastProvider>");
  return c.toast;
}

/* Small feedback atoms (server-safe) */
export function Spinner({ label = "Loading", className }: { label?: string; className?: string }) {
  return <span role="status" aria-label={label} className={cx("ph-spinner", className)} />;
}
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cx("ph-skeleton", className)} {...rest} />;
}
export function Badge({
  tone = "default",
  className,
  ...rest
}: { tone?: "default" | "accent" | "success" | "danger" } & HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("ph-badge", `ph-badge--${tone}`, className)} {...rest} />;
}
export function Progress({ value, label, className }: { value: number; label: string; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.max(0, Math.min(100, value)))}
      className={cx("ph-progress", className)}
    >
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
