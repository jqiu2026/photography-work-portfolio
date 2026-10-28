import { schema } from "@jerryqiu/db";
import { desc } from "drizzle-orm";
import { requirePageUser } from "@/auth";
import { ActionForm, ConfirmButton, F } from "@/components/admin/form-kit";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { addRedirect, deleteRedirect } from "./actions";

export const metadata = { title: "Redirects" };

export default async function RedirectsPage() {
  await requirePageUser("content.write", "/admin/redirects");
  const rows = await withDb((db) => db.select().from(schema.redirects).orderBy(desc(schema.redirects.createdAt)));
  if (!rows) return <NoDb />;
  return (
    <>
      <PageHead
        title="Redirects"
        lede="Send an old address to a new one. Changing a post's slug adds one automatically."
      />
      <table className="adm-table">
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Site</th>
            <th>Hits</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.fromPath}</td>
              <td>{r.toPath}</td>
              <td>{r.site}</td>
              <td>{r.hits}</td>
              <td>
                <ConfirmButton
                  label="Remove"
                  confirm={`Remove the redirect from ${r.fromPath}?`}
                  action={deleteRedirect.bind(null, r.id)}
                />
              </td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={5} className="adm-note">
                No redirects.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <section className="adm-card" style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "var(--hm-text-xl)" }}>Add a redirect</h2>
        <ActionForm action={addRedirect} submitLabel="Add redirect">
          <F
            name="site"
            label="Site"
            type="select"
            defaultValue="hub"
            options={[
              { value: "hub", label: "Hub" },
              { value: "photos", label: "Photography" },
              { value: "music", label: "Music" },
              { value: "flying", label: "Flying" },
            ]}
          />
          <F name="fromPath" label="From path" placeholder="/old-page" />
          <F name="toPath" label="To" placeholder="/new-page or https://…" />
          <F name="permanent" label="Permanent (301)" type="checkbox" defaultValue />
        </ActionForm>
      </section>
    </>
  );
}
