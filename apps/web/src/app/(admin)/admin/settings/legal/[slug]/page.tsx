import { schema } from "@jerryqiu/db";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/auth";
import { ActionForm, F } from "@/components/admin/form-kit";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { saveLegalPage } from "../../actions";

const TITLES: Record<string, string> = {
  privacy: "Privacy policy",
  terms: "Terms of use",
  licensing: "Licensing",
  accessibility: "Accessibility statement",
};

export default async function LegalEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!TITLES[slug]) notFound();
  await requirePageUser("settings.write", `/admin/settings/legal/${slug}`);
  const row = await withDb(
    async (db) =>
      (
        await db
          .select()
          .from(schema.pages)
          .where(and(eq(schema.pages.site, "hub"), eq(schema.pages.slug, slug)))
          .limit(1)
      )[0] ?? null,
  );
  if (row === undefined) return <NoDb />;
  return (
    <>
      <PageHead
        title={TITLES[slug]}
        lede="Markdown. Saved as a draft unless you choose Published. Not legal advice: have it reviewed."
      />
      <ActionForm action={saveLegalPage}>
        <F name="slug" label="slug" type="hidden" defaultValue={slug} />
        <F name="title" label="Title" defaultValue={row?.title ?? TITLES[slug]} required />
        <F name="body" label="Page text (Markdown)" type="textarea" rows={22} defaultValue={row?.body ?? ""} />
        <F
          name="status"
          label="Status"
          type="select"
          defaultValue={row?.status ?? "draft"}
          options={[
            { value: "draft", label: "Draft (not shown; the built-in text stays)" },
            { value: "published", label: "Published" },
          ]}
        />
      </ActionForm>
    </>
  );
}
