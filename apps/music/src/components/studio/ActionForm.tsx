"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState, useTransition } from "react";
import { Button, FormMessage } from "@/components/ui";

type Result = { ok: true; message: string; [k: string]: unknown } | { ok: false; error: string } | null;

/**
 * A studio form. `action` is a server action taking FormData; the answer is shown under the button (an error as an alert,
 * a confirmation as a status). `confirm` asks first. `reset` clears the fields after a success.
 *
 * The form is submitted with onSubmit and a transition, NOT as a `<form action>`: React 19 resets the fields of an
 * action-form after every submit, errors included, which would throw away what the person typed.
 */
export function ActionForm({
  action,
  children,
  submit = "Save",
  variant = "primary",
  confirm,
  reset,
  className = "mu-form",
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
  const [state, setState] = useState<Result>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    start(async () => {
      const r = await action(data);
      setState(r);
      if (r?.ok) {
        if (reset) form.reset();
        if (refresh) router.refresh();
        if (typeof r.redirect === "string") router.push(r.redirect);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={className}
      style={
        inline ? { display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "end", maxWidth: "none" } : undefined
      }
    >
      {children}
      <div className="mu-row">
        <Button type="submit" variant={variant} loading={pending} size={inline ? "sm" : "md"}>
          {submit}
        </Button>
        {state && !state.ok ? <FormMessage>{state.error}</FormMessage> : null}
        {state?.ok ? <FormMessage ok>{state.message}</FormMessage> : null}
      </div>
    </form>
  );
}
