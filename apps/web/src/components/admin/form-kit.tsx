"use client";

import { Button, Checkbox, Field, Input, Row, Select, Textarea, useToast } from "@halation/ui";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  redirectTo?: string;
  id?: string;
};
export type FormAction = (prev: ActionState, data: FormData) => Promise<ActionState>;

const StateCtx = createContext<ActionState>({});

/**
 * A form wired to a Server Action: pending state, field errors from the server (zod), toasts, an unsaved-changes guard,
 * and an optional redirect after success. All validation is repeated on the server; this only shows its results.
 */
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  secondary,
  className,
}: { action: FormAction; children: ReactNode; submitLabel?: string; secondary?: ReactNode; className?: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  const toast = useToast();
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: react to each new action result only
  useEffect(() => {
    if (state.ok) {
      setDirty(false);
      if (state.message) toast(state.message);
      if (state.redirectTo) router.push(state.redirectTo);
      else router.refresh();
    } else if (state.error) toast(state.error, "danger");
  }, [state]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <StateCtx.Provider value={state}>
      <form
        ref={ref}
        className={className ?? "adm-form"}
        onInput={() => setDirty(true)}
        // Submit through a transition instead of <form action>: React 19 resets uncontrolled fields after a form action,
        // which would wipe what the person typed whenever the server returns a validation error.
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startTransition(() => formAction(data));
        }}
        noValidate
      >
        {children}
        {state.error && !state.fieldErrors ? (
          <p role="alert" className="adm-bad">
            {state.error}
          </p>
        ) : null}
        <Row gap={3} wrap>
          <Button type="submit" loading={pending}>
            {submitLabel}
          </Button>
          {secondary}
          {dirty ? (
            <span className="adm-note" aria-live="polite">
              Unsaved changes
            </span>
          ) : null}
        </Row>
      </form>
    </StateCtx.Provider>
  );
}

/** A Field wired to the server's error for `name`, for controls that are not rendered by <F> (controlled inputs, custom widgets). */
export function FieldE({
  name,
  label,
  hint,
  required,
  children,
}: { name: string; label: string; hint?: string; required?: boolean; children: ReactNode }) {
  const err = useContext(StateCtx).fieldErrors?.[name];
  return (
    <Field label={label} hint={hint} error={err} required={required}>
      {children}
    </Field>
  );
}

/** Shows the server's error for `name` under a custom widget (e.g. the markdown editor). */
export function ErrorFor({ name }: { name: string }) {
  const err = useContext(StateCtx).fieldErrors?.[name];
  return err ? (
    <p role="alert" className="adm-bad" style={{ marginTop: "0.4rem", fontSize: "var(--hl-text-sm)" }}>
      {err}
    </p>
  ) : null;
}

type FieldProps = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string | number | boolean | null;
  type?: "text" | "url" | "email" | "date" | "number" | "textarea" | "select" | "checkbox" | "hidden";
  options?: { value: string; label: string }[];
  rows?: number;
  placeholder?: string;
  min?: number;
  max?: number;
};

/** One form control with label, hint and the server's error for this field. */
export function F({
  name,
  label,
  hint,
  required,
  defaultValue,
  type = "text",
  options,
  rows = 5,
  placeholder,
  min,
  max,
}: FieldProps) {
  const err = useContext(StateCtx).fieldErrors?.[name];
  if (type === "hidden") return <input type="hidden" name={name} defaultValue={String(defaultValue ?? "")} />;
  if (type === "checkbox")
    return (
      <div>
        <Checkbox label={label} name={name} defaultChecked={Boolean(defaultValue)} value="on" />
        {hint ? (
          <p className="adm-note" style={{ marginTop: "0.3rem" }}>
            {hint}
          </p>
        ) : null}
        {err ? (
          <p role="alert" className="adm-bad" style={{ marginTop: "0.3rem", fontSize: "var(--hl-text-sm)" }}>
            {err}
          </p>
        ) : null}
      </div>
    );
  return (
    <Field label={label} hint={hint} error={err} required={required}>
      {type === "textarea" ? (
        <Textarea name={name} defaultValue={String(defaultValue ?? "")} rows={rows} placeholder={placeholder} />
      ) : type === "select" ? (
        <Select name={name} defaultValue={String(defaultValue ?? "")}>
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          name={name}
          type={type}
          defaultValue={defaultValue == null ? "" : String(defaultValue)}
          placeholder={placeholder}
          min={min}
          max={max}
        />
      )}
    </Field>
  );
}

/** A tiny confirm-then-submit button for destructive actions (soft delete, restore, purge). */
export function ConfirmButton({
  action,
  label,
  confirm,
  variant = "ghost",
  children,
}: {
  action: () => Promise<ActionState>;
  label: string;
  confirm: string;
  variant?: "ghost" | "quiet" | "solid";
  children?: ReactNode;
}) {
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      loading={busy}
      onClick={async () => {
        if (!window.confirm(confirm)) return;
        setBusy(true);
        const r = await action();
        setBusy(false);
        if (r.ok) {
          if (r.message) toast(r.message);
          if (r.redirectTo) router.push(r.redirectTo);
          else router.refresh();
        } else toast(r.error ?? "Failed", "danger");
      }}
    >
      {children ?? label}
    </Button>
  );
}
