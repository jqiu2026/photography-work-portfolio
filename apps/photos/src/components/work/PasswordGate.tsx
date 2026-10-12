"use client";

import { Button, Field, Input } from "@placeholder/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

/** Simple shared-password gate for pages marked `protected: true`. Replaced by real accounts in Phase 2. */
export function PasswordGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    const res = await fetch("/api/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError("That password isn't right.");
  }
  return (
    <form onSubmit={submit} style={{ display: "grid", gap: "1rem", maxWidth: "24rem" }}>
      <Field label="Password" error={error}>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </Field>
      <Button type="submit" loading={busy}>
        Unlock
      </Button>
    </form>
  );
}
