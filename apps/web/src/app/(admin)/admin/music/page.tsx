import { schema } from "@jerryqiu/db";
import { Badge, Button } from "@halation/ui";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import NextLink from "next/link";
import { ActionForm, F } from "@/components/admin/form-kit";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { saveMusicBackground } from "./actions";

export const metadata = { title: "Music" };

type Background = { story?: string; instruments?: string[]; repertoire?: string[] };

export default async function MusicAdmin() {
  const data = await withDb(async (db) => {
    const items = await db
      .select()
      .from(schema.musicItems)
      .where(isNull(schema.musicItems.deletedAt))
      .orderBy(asc(schema.musicItems.sort), desc(schema.musicItems.date));
    const [bg] = await db
      .select()
      .from(schema.settings)
      .where(and(eq(schema.settings.site, "music"), eq(schema.settings.key, "background")))
      .limit(1);
    return { items, bg: (bg?.value ?? {}) as Background };
  });
  if (!data) return <NoDb />;
  return (
    <>
      <PageHead
        title="Music"
        lede="Recordings and performances for music.jerryqiu.com. Players load only when a visitor presses play."
        actions={
          <Button as={NextLink} href="/admin/music/new">
            Add item
          </Button>
        }
      />
      <table className="adm-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Kind</th>
            <th>Rights</th>
            <th>Visible</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((m) => (
            <tr key={m.id}>
              <td>
                <NextLink href={`/admin/music/${m.id}`}>{m.title}</NextLink>
                {m.needsReview ? <span className="adm-note"> · needs review</span> : null}
              </td>
              <td>{m.kind}</td>
              <td>
                <Badge>{m.rights}</Badge>
              </td>
              <td>{m.visible ? "Yes" : "Hidden"}</td>
            </tr>
          ))}
          {!data.items.length ? (
            <tr>
              <td colSpan={4} className="adm-note">
                Nothing here yet. Add your first recording or performance.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <h2 style={{ margin: "3rem 0 1rem", fontSize: "var(--hl-text-2xl)", letterSpacing: "-0.03em" }}>Background</h2>
      <ActionForm action={saveMusicBackground}>
        <F
          name="story"
          label="How you started, in your voice"
          type="textarea"
          rows={5}
          defaultValue={data.bg.story}
          hint="Leave empty to hide the section. Write only what is true."
        />
        <F
          name="instruments"
          label="Instruments"
          defaultValue={(data.bg.instruments ?? []).join(", ")}
          hint="Comma separated."
        />
        <F
          name="repertoire"
          label="Repertoire"
          defaultValue={(data.bg.repertoire ?? []).join(", ")}
          hint="Comma separated pieces or styles."
        />
      </ActionForm>
    </>
  );
}
