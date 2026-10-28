import { schema } from "@jerryqiu/db";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/form-kit";
import { ProjectForm, type ProjectValues } from "@/components/admin/ProjectForm";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { restoreProjectVersion } from "../actions";

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const data = isNew
    ? null
    : await withDb(async (db) => {
        const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
        const versions = project
          ? await db
              .select()
              .from(schema.projectVersions)
              .where(eq(schema.projectVersions.projectId, id))
              .orderBy(desc(schema.projectVersions.version))
              .limit(20)
          : [];
        return { project, versions };
      });
  if (!isNew && data === undefined) return <NoDb />;
  if (!isNew && !data?.project) notFound();
  const p = data?.project;
  const values: ProjectValues = {
    id: p?.id,
    title: p?.title ?? "",
    slug: p?.slug ?? "",
    type: p?.type ?? "photography",
    summary: p?.summary ?? "",
    date: p?.date ?? "",
    client: p?.client ?? "",
    role: p?.role ?? "",
    category: p?.category ?? "",
    coverMediaId: p?.coverMediaId ?? null,
    status: p?.status === "published" ? "published" : "draft",
    featured: p?.featured ?? false,
    protectedPage: p?.protectedPage ?? false,
    sort: p?.sort ?? 0,
    related: p?.related ?? [],
    blocks: (p?.blocks ?? []) as ProjectValues["blocks"],
    credits: (p?.credits ?? []) as ProjectValues["credits"],
  };
  return (
    <>
      <PageHead title={isNew ? "New project" : "Edit project"} />
      <ProjectForm values={values} />
      {data?.versions.length ? (
        <section style={{ marginTop: "3rem" }} aria-labelledby="hist">
          <h2 id="hist" style={{ fontSize: "var(--hm-text-xl)", marginBottom: "0.75rem" }}>
            Version history
          </h2>
          <table className="adm-table">
            <tbody>
              {data.versions.map((v) => (
                <tr key={v.id}>
                  <td>Version {v.version}</td>
                  <td className="adm-note">{v.createdAt.toLocaleString()}</td>
                  <td className="adm-note">{v.createdBy}</td>
                  <td>
                    <ConfirmButton
                      label="Restore"
                      confirm={`Restore version ${v.version} as the current draft?`}
                      action={restoreProjectVersion.bind(null, id, v.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </>
  );
}
