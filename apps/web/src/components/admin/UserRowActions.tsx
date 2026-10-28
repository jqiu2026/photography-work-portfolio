"use client";

import { Select, useToast } from "@/components/kit-client";

import { useRouter } from "next/navigation";
import { changeRole, setUserActive } from "@/app/(admin)/admin/users/actions";
import { ConfirmButton } from "./form-kit";

export function UserRowActions({
  id,
  role,
  active,
  self,
}: { id: string; role: "owner" | "editor"; active: boolean; self: boolean }) {
  const toast = useToast();
  const router = useRouter();
  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
      <Select
        aria-label="Role"
        value={role}
        disabled={self}
        onChange={async (e) => {
          const r = await changeRole(id, e.target.value as "owner" | "editor");
          toast(r.ok ? (r.message ?? "Saved") : (r.error ?? "Failed"), r.ok ? undefined : "danger");
          router.refresh();
        }}
      >
        <option value="editor">Editor</option>
        <option value="owner">Owner</option>
      </Select>
      {active ? (
        self ? (
          <span className="adm-note">active</span>
        ) : (
          <ConfirmButton
            label="Remove access"
            confirm="Remove this person's access? It ends on their next click."
            action={setUserActive.bind(null, id, false)}
          />
        )
      ) : (
        <ConfirmButton
          label="Restore access"
          confirm="Allow this person to sign in again?"
          action={setUserActive.bind(null, id, true)}
        />
      )}
    </div>
  );
}
