"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useActionState } from "react";
import { Button, FormMessage } from "@/components/ui";

type Result = { ok: true; message: string; [k: string]: unknown } | { ok: false; error: string } | null;

/**
 * A studio form. `action` is a server action taking FormData; the answer is shown under the button (an error as an alert,
 * a confirmation as a status). `confirm` asks first. `reset` clears the fields after success. `onDone` can redirect.
 */
export function ActionForm({
  action,
  children,
  submit = "Save",
  variant = "primary",
  confirm,
  reset,
  className = "mk-form",
  inline,
  refresh = true,
}: {
  action: (form: FormData) => Promise<Result>;
  children?: ReactNode;
  submit?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  confirm?: string;
  reset?: boolean;
  className?: string;
  inline?: boolean;
  refresh?: boolean;
}) {
  const router = useRouter();
  const [state, run, pending] = useActionState(async (_p: Result, form: FormData) => {
    if (confirm && !window.confirm(confirm)) return null;
    const r = await action(form);
    if (r?.ok && refresh) router.refresh();
    if (r?.ok && typeof r.redirect === "string") router.push(r.redirect);
    return r;
  }, null);
  return (
    <form
      action={run}
      className={className}
      ref={(el) => {
        if (el && reset && state?.ok) el.reset();
      }}
      style={
        inline ? { display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "end", maxWidth: "none" } : undefined
      }
    >
      {children}
      <div className="mk-row">
        <Button type="submit" variant={variant} loading={pending} size={inline ? "sm" : "md"}>
          {submit}
        </Button>
        {state && !state.ok ? <FormMessage>{state.error}</FormMessage> : null}
        {state?.ok ? <FormMessage ok>{state.message}</FormMessage> : null}
      </div>
    </form>
  );
}
