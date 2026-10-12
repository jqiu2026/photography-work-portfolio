import { schema } from "@jerryqiu/db";
import { Button } from "@placeholder/ui";
import { eq } from "drizzle-orm";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, ConfirmButton, F } from "@/components/admin/form-kit";
import { Uploader } from "@/components/admin/Uploader";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { mediaUsage } from "@/lib/media-usage";
import { currentUser } from "@/auth";
import { deleteMedia, saveMedia } from "../actions";

const licenses = [
  ["all-rights-reserved", "All rights reserved (default)"],
  ["cc-by", "CC BY"],
  ["cc-by-nc", "CC BY-NC"],
  ["cc-by-sa", "CC BY-SA"],
  ["cc0", "CC0 (public domain)"],
].map(([value, label]) => ({ value, label }));

export default async function MediaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const data = await withDb(async (db) => {
    const [m] = await db.select().from(schema.media).where(eq(schema.media.id, id)).limit(1);
    return m ? { m, usage: await mediaUsage(db, id) } : null;
  });
  if (data === undefined) return <NoDb />;
  if (!data) notFound();
  const { m, usage } = data;
  const exif = Object.entries((m.exif ?? {}) as Record<string, unknown>);
  return (
    <>
      <PageHead
        title={m.filename}
        lede={`${m.width} × ${m.height} px · ${(m.bytes / 1024 / 1024).toFixed(1)} MB original (private)`}
        actions={
          user?.role === "owner" ? (
            <Button as="a" href={`/api/admin/media/${m.id}/original`} variant="ghost" size="sm">
              Download original
            </Button>
          ) : undefined
        }
      />
      <div
        style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", gap: "2rem" }}
        className="adm-media-detail"
      >
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/admin/media/${m.id}/file?w=960`}
            alt={m.alt ?? ""}
            style={{ width: "100%", borderRadius: 4, border: "1px solid var(--ph-line)" }}
          />
          <h2 style={{ fontSize: "var(--ph-text-lg)", margin: "1.5rem 0 0.5rem" }}>Replace the file</h2>
          <p className="adm-note" style={{ marginBottom: "0.75rem" }}>
            Keeps the same id, so every page that uses this image updates.
          </p>
          <Uploader replaceId={m.id} multiple={false} label="Choose replacement" />
          <h2 style={{ fontSize: "var(--ph-text-lg)", margin: "1.5rem 0 0.5rem" }}>Used in</h2>
          {usage.length ? (
            <ul style={{ paddingLeft: "1.2rem" }}>
              {usage.map((u) => (
                <li key={`${u.kind}-${u.href}`}>
                  <NextLink href={u.href}>{u.title}</NextLink> <span className="adm-note">({u.kind})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-note">Not used anywhere yet.</p>
          )}
          {exif.length ? (
            <>
              <h2 style={{ fontSize: "var(--ph-text-lg)", margin: "1.5rem 0 0.5rem" }}>Camera details</h2>
              <p className="adm-note" style={{ marginBottom: "0.5rem" }}>
                Shown here only. Public copies carry just your name and copyright; location is never published.
              </p>
              <table className="adm-table">
                <tbody>
                  {exif.map(([k, v]) => (
                    <tr key={k}>
                      <td className="adm-note">{k}</td>
                      <td>{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
        </div>
        <div>
          <ActionForm
            action={saveMedia}
            secondary={
              <ConfirmButton
                label="Delete"
                confirm="Move this image to the trash? (Only possible when it is not used anywhere.)"
                action={deleteMedia.bind(null, m.id)}
              />
            }
          >
            <F name="id" label="id" type="hidden" defaultValue={m.id} />
            <F
              name="alt"
              label="Alt text"
              type="textarea"
              rows={2}
              defaultValue={m.alt}
              hint="Describe what the picture shows, for screen readers and search. Leave empty only for decorative images."
            />
            <F name="caption" label="Caption" defaultValue={m.caption} />
            <F
              name="license"
              label="Licence"
              type="select"
              options={licenses}
              defaultValue={m.license}
              hint="All rights reserved unless you choose otherwise."
            />
            <fieldset
              style={{
                border: "1px solid var(--ph-line)",
                borderRadius: 4,
                padding: "1rem",
                display: "grid",
                gap: "0.75rem",
              }}
            >
              <legend style={{ padding: "0 0.4rem" }}>People in this photo</legend>
              <F name="containsPeople" label="Contains people" type="checkbox" defaultValue={m.containsPeople} />
              <F
                name="minors"
                label="Includes minors"
                type="checkbox"
                defaultValue={m.minors}
                hint="Marked “needs review” unless a release is on file."
              />
              <F name="releaseOnFile" label="Release on file" type="checkbox" defaultValue={m.releaseOnFile} />
            </fieldset>
            <F
              name="reviewStatus"
              label="Review status"
              type="select"
              options={[
                { value: "ok", label: "OK to publish" },
                { value: "needs_review", label: "Needs review" },
              ]}
              defaultValue={m.reviewStatus}
            />
          </ActionForm>
        </div>
      </div>
    </>
  );
}
