"use client";

import { type FormEvent, useState, useTransition } from "react";

/**
 * Submits a form to a server action with onSubmit and a transition. A `<form action>` (useActionState) makes React 19 reset
 * every uncontrolled field after the action finishes, errors included, which throws away what the visitor typed.
 */
export function useServerForm<S>(action: (data: FormData) => Promise<S>) {
  const [state, setState] = useState<S | null>(null);
  const [pending, start] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    start(async () => setState(await action(data)));
  };
  return { state, pending, onSubmit };
}
