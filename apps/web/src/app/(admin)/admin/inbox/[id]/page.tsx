import { schema } from "@jerryqiu/db";
import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/auth";
import { ActionForm, ConfirmButton, F } from "@/components/admin/form-kit";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { deleteMessage, saveMessage } from "../actions";

export default async function Message({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser("inbox.read");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const m = await withDb(async (db) => {
    const [row] = await db
      .select()
      .from(schema.inboxMessages)
      .where(and(eq(schema.inboxMessages.id, id), isNull(schema.inboxMessages.deletedAt)))
      .limit(1);
    // Opening a new message marks it read (idempotent).
    if (row?.status === "new") {
      await db.update(schema.inboxMessages).set({ status: "read" }).where(eq(schema.inboxMessages.id, id));
      row.status = "read";
    }
    return row ?? null;
  });
  if (m === undefined) return <NoDb />;
  if (!m) notFound();
  const subject = `Re: ${(m.topic ?? "your message").replace(/[\r\n]+/g, " ")}`;
  return (
    <>
      <PageHead
        title={`Message from ${m.name}`}
        lede={`${m.email} · ${m.site} · ${m.createdAt.toISOString().slice(0, 16).replace("T", " ")}`}
      />
      <div className="adm-card">
        {/* Plain text only: never rendered as HTML or Markdown. */}
        <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{m.message}</p>
        <p>
          <a href={`mailto:${m.email}?subject=${encodeURIComponent(subject)}`} style={{ textDecoration: "underline" }}>
            Reply by email
          </a>
        </p>
      </div>
      <ActionForm
        action={saveMessage}
        secondary={
          user.role === "owner" ? (
            <ConfirmButton
              label="Delete"
              confirm="Move this message to the trash?"
              action={deleteMessage.bind(null, m.id)}
            />
          ) : undefined
        }
      >
        <F name="id" label="id" type="hidden" defaultValue={m.id} />
        <F
          name="status"
          label="Status"
          type="select"
          defaultValue={m.status}
          options={["new", "read", "replied", "archived", "spam"].map((v) => ({ value: v, label: v }))}
        />
        <F name="notes" label="Private notes" type="textarea" rows={4} defaultValue={m.notes} />
      </ActionForm>
    </>
  );
}
