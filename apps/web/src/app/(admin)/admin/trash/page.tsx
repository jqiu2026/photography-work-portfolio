import { can } from "@jerryqiu/auth";
import { requirePageUser } from "@/auth";
import { ConfirmButton } from "@/components/admin/form-kit";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { RETENTION_DAYS, listTrash } from "@/lib/trash";
import { purge, restore } from "./actions";

export const metadata = { title: "Trash" };

export default async function TrashPage() {
  const me = await requirePageUser("trash.restore", "/admin/trash");
  const items = await withDb((db) => listTrash(db));
  if (!items) return <NoDb />;
  const canPurge = can(me.role, "trash.purge");
  const left = (d: Date) => Math.max(0, RETENTION_DAYS - Math.floor((Date.now() - d.getTime()) / 86_400_000));
  return (
    <>
      <PageHead
        title="Trash"
        lede={`Deleted items stay here for ${RETENTION_DAYS} days, then are removed for good. Restore puts one back exactly as it was.`}
      />
      <table className="adm-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Type</th>
            <th>Deleted</th>
            <th>Removed in</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={`${i.kind}-${i.id}`}>
              <td>{i.title}</td>
              <td>{i.label}</td>
              <td>{i.deletedAt.toISOString().slice(0, 10)}</td>
              <td>{left(i.deletedAt)} days</td>
              <td style={{ display: "flex", gap: "0.5rem" }}>
                <ConfirmButton
                  label="Restore"
                  confirm={`Restore “${i.title}”?`}
                  action={restore.bind(null, i.kind, i.id)}
                />
                {canPurge ? (
                  <ConfirmButton
                    label="Delete forever"
                    confirm={`Permanently delete “${i.title}”? This cannot be undone.`}
                    action={purge.bind(null, i.kind, i.id)}
                  />
                ) : null}
              </td>
            </tr>
          ))}
          {!items.length ? (
            <tr>
              <td colSpan={5} className="adm-note">
                The trash is empty.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  );
}
