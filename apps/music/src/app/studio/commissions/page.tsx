import * as m from "@jerryqiu/db/music";
import { commissionStatusAction } from "@/app/studio/actions";
import { ActionForm } from "@/components/studio/ActionForm";
import { NoDb, StudioHead } from "@/components/studio/StudioBits";
import { Field, Input, Select } from "@/components/ui";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

export default async function Commissions() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const list = await m.listCommissions(db);
  return (
    <>
      <StudioHead title="Commission inquiries" />
      {list.length ? (
        list.map((c) => (
          <section key={c.id} className="st-card">
            <div className="st-rowline">
              <strong>
                {c.name}{" "}
                <span className="mu-muted">
                  {c.email}
                  {c.organization ? ` · ${c.organization}` : ""}
                </span>
              </strong>
              <span className="mu-muted">{c.createdAt.toISOString().slice(0, 10)}</span>
            </div>
            <p className="mu-muted" style={{ margin: 0 }}>
              {[
                c.forces && `For: ${c.forces}`,
                c.occasion && `Occasion: ${c.occasion}`,
                c.deadline && `By: ${c.deadline}`,
                c.budget && `Budget: ${c.budget}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{c.message}</p>
            <ActionForm action={commissionStatusAction} submit="Save" inline>
              <input type="hidden" name="id" value={c.id} />
              <Field label="Status">
                <Select
                  name="status"
                  defaultValue={c.status}
                  options={[
                    { value: "new", label: "New" },
                    { value: "talking", label: "In conversation" },
                    { value: "accepted", label: "Accepted" },
                    { value: "declined", label: "Declined" },
                    { value: "done", label: "Done" },
                  ]}
                />
              </Field>
              <Field label="Private note">
                <Input name="note" defaultValue={c.ownerNote ?? ""} maxLength={400} />
              </Field>
            </ActionForm>
          </section>
        ))
      ) : (
        <p className="mu-muted">No inquiries yet.</p>
      )}
    </>
  );
}
