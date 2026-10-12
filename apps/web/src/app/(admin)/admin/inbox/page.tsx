import { schema } from "@jerryqiu/db";
import { Badge } from "@halation/ui";
import { desc, eq, isNull, and } from "drizzle-orm";
import NextLink from "next/link";
import { requirePageUser } from "@/auth";
import { ActionForm, F } from "@/components/admin/form-kit";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { eraseContact } from "./actions";

export const metadata = { title: "Inbox" };
const FILTERS = ["new", "read", "replied", "archived", "spam"] as const;

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requirePageUser("inbox.read", "/admin/inbox");
  const { status } = await searchParams;
  const filter = FILTERS.find((f) => f === status);
  const rows = await withDb((db) =>
    db
      .select()
      .from(schema.inboxMessages)
      .where(and(isNull(schema.inboxMessages.deletedAt), filter ? eq(schema.inboxMessages.status, filter) : undefined))
      .orderBy(desc(schema.inboxMessages.createdAt))
      .limit(200),
  );
  if (!rows) return <NoDb />;
  return (
    <>
      <PageHead title="Inbox" lede="Messages from the contact and booking forms. Replies go from your own email." />
      <nav aria-label="Filter" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <NextLink href="/admin/inbox" aria-current={!filter ? "page" : undefined}>
          All
        </NextLink>
        {FILTERS.map((f) => (
          <NextLink key={f} href={`/admin/inbox?status=${f}`} aria-current={filter === f ? "page" : undefined}>
            {f}
          </NextLink>
        ))}
      </nav>
      <table className="adm-table">
        <thead>
          <tr>
            <th>From</th>
            <th>Topic</th>
            <th>Site</th>
            <th>Status</th>
            <th>Received</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id}>
              <td>
                <NextLink href={`/admin/inbox/${m.id}`} style={{ fontWeight: m.status === "new" ? 600 : 400 }}>
                  {m.name}
                </NextLink>{" "}
                <span className="adm-note">{m.email}</span>
              </td>
              <td>{m.topic}</td>
              <td>{m.site}</td>
              <td>
                <Badge>{m.status}</Badge>
              </td>
              <td>{m.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={5} className="adm-note">
                No messages yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {user.role === "owner" ? (
        <section className="adm-card" style={{ marginTop: "3rem" }} aria-labelledby="erase">
          <h2 id="erase" style={{ fontSize: "var(--hl-text-xl)" }}>
            Delete someone's contact data
          </h2>
          <p className="adm-note">
            For a privacy request: permanently deletes every stored message from an email address. This cannot be undone
            and does not go through Trash.
          </p>
          <ActionForm action={eraseContact} submitLabel="Delete permanently">
            <F name="email" label="Email address" type="email" />
          </ActionForm>
        </section>
      ) : null}
    </>
  );
}
