import { schema } from "@jerryqiu/db";
import { Badge } from "@placeholder/ui";
import { asc } from "drizzle-orm";
import { kit, requirePageUser } from "@/auth";
import { ActionForm, F } from "@/components/admin/form-kit";
import { NoDb, PageHead } from "@/components/admin/ui";
import { UserRowActions } from "@/components/admin/UserRowActions";
import { withDb } from "@/lib/admin-db";
import { inviteUser } from "./actions";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requirePageUser("users.manage", "/admin/users");
  const rows = await withDb((db) => db.select().from(schema.users).orderBy(asc(schema.users.email)));
  if (!rows) return <NoDb />;
  return (
    <>
      <PageHead
        title="Users"
        lede={`Only @${kit.domain} Google accounts that are on this list can sign in. Owners can do everything; editors can write and publish content but cannot change settings or users.`}
      />
      <table className="adm-table">
        <thead>
          <tr>
            <th>Person</th>
            <th>Role</th>
            <th>Last sign-in</th>
            <th>Access</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <td>
                {u.name ?? u.email} {u.name ? <span className="adm-note">{u.email}</span> : null}
                {u.email === me.email ? <span className="adm-note"> · you</span> : null}
              </td>
              <td>
                <Badge>{u.role}</Badge>
              </td>
              <td>{u.lastSignInAt ? u.lastSignInAt.toISOString().slice(0, 10) : "never"}</td>
              <td>
                <UserRowActions
                  id={u.id}
                  role={u.role === "owner" ? "owner" : "editor"}
                  active={u.active}
                  self={u.email === me.email}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="adm-card" style={{ marginTop: "2rem" }} aria-labelledby="invite">
        <h2 id="invite" style={{ fontSize: "var(--ph-text-xl)" }}>
          Invite someone
        </h2>
        <ActionForm action={inviteUser} submitLabel="Allow sign-in">
          <F name="email" label="Email" type="email" placeholder={`name@${kit.domain}`} />
          <F
            name="role"
            label="Role"
            type="select"
            defaultValue="editor"
            options={[
              { value: "editor", label: "Editor" },
              { value: "owner", label: "Owner" },
            ]}
          />
        </ActionForm>
      </section>
    </>
  );
}
