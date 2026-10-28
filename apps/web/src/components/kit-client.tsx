"use client";

import {
  Dialog as HmDialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerTitle,
  useToast as useHmToast,
} from "@holominimal/ui";
import { type ComponentProps, type ReactNode, createContext, useCallback, useContext, useId } from "react";

/*
 * The admin's interactive pieces on Holominimal: labelled fields (native inputs and selects, so forms post and tests
 * can fill them), dialogs, the side drawer and toasts. Styled with Holominimal's own classes.
 */

type FieldCtx = { id: string; describedBy?: string; invalid: boolean };
const FieldContext = createContext<FieldCtx | null>(null);
const useField = () => useContext(FieldContext);
const cls = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: { label: string; hint?: string; error?: string; required?: boolean; children: ReactNode; className?: string }) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={cls("hm-field", className)}>
        <label htmlFor={id} className="hm-field-label">
          {label}
          {required ? <span aria-hidden> *</span> : null}
        </label>
        {children}
        {hint ? (
          <p id={`${id}-hint`} className="hm-field-hint">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${id}-error`} className="hm-field-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

function wire(f: FieldCtx | null) {
  return f ? { id: f.id, "aria-describedby": f.describedBy, "aria-invalid": f.invalid || undefined } : {};
}

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cls("hm-input", className)} {...wire(useField())} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cls("hm-input hm-textarea", className)} {...wire(useField())} {...rest} />;
}

/** A native select (so a form posts it and the keyboard works everywhere), in Holominimal's control style. */
export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={cls("hm-input adm-select", className)} {...wire(useField())} {...rest}>
      {children}
    </select>
  );
}

export function Checkbox({ label, className, ...rest }: { label: ReactNode } & Omit<ComponentProps<"input">, "type">) {
  const id = useId();
  return (
    <div className={cls("hm-check", className)}>
      <input id={id} type="checkbox" className="hm-check-input" {...rest} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export function Dialog({
  title,
  description,
  open,
  onOpenChange,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <HmDialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
        {children}
      </DialogContent>
    </HmDialog>
  );
}

export function Sheet({
  title,
  side = "right",
  open,
  onOpenChange,
  children,
}: {
  title: ReactNode;
  side?: "left" | "right" | "bottom";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side={side}>
        <DrawerTitle>{title}</DrawerTitle>
        {children}
      </DrawerContent>
    </Drawer>
  );
}

type Tone = "success" | "danger" | "info" | "warning" | "neutral";
/** `toast("Saved")` or `toast("Could not save", "danger")`: a corner toast. */
export function useToast() {
  const { toast } = useHmToast();
  return useCallback((message: string, tone: Tone = "success") => toast({ title: message, tone }), [toast]);
}
