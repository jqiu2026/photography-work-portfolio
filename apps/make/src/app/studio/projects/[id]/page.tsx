import * as mk from "@jerryqiu/db/make";
import Link from "next/link";
import { notFound } from "next/navigation";
import { coverAction, deleteProjectAction, removeImageAction, saveImageAction } from "@/app/studio/actions";
import { ActionForm } from "@/components/studio/ActionForm";
import { ProjectForm } from "@/components/studio/ProjectForm";
import { ShotUploader } from "@/components/studio/ShotUploader";
import { NoDb, StudioHead } from "@/components/studio/StudioBits";
import { Button, Checkbox, Field, Input, Tag } from "@/components/ui";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const d = await mk.getAdmin(db, id);
  if (!d) notFound();
  const { project, images } = d;
  return (
    <>
      <StudioHead title={project.title}>
        {project.published ? (
          <Button asChild variant="secondary">
            <Link href={`/projects/${project.slug}`}>View on the site</Link>
          </Button>
        ) : null}
      </StudioHead>
      <section className="st-card" aria-labelledby="details">
        <h2 id="details">Details and write-up</h2>
        <ProjectForm project={project} />
      </section>
      <section className="st-card" aria-labelledby="shots">
        <h2 id="shots">Screenshots</h2>
        <p className="mk-muted">
          A screenshot stays hidden until you have looked at it for secrets, keys and other people's data, described it,
          and ticked "checked". Only a first name or handle should be visible.
        </p>
        {images.map((i) => (
          <div key={i.id} className="st-rowline" style={{ alignItems: "start" }}>
            <img
              src={`/studio/preview/${i.id}`}
              alt=""
              width={160}
              style={{ borderRadius: 6, border: "1px solid var(--hm-line)" }}
            />
            <ActionForm action={saveImageAction} submit="Save" inline>
              <input type="hidden" name="id" value={i.id} />
              <Field label="Description (for people who cannot see it)">
                <Input name="alt" defaultValue={i.alt} maxLength={300} />
              </Field>
              <Field label="Caption (optional)">
                <Input name="caption" defaultValue={i.caption ?? ""} maxLength={300} />
              </Field>
              <Checkbox name="reviewed" defaultChecked={i.reviewed} label="Checked: no secrets or private data" />
            </ActionForm>
            <span className="mk-row">
              {i.cover ? (
                <Tag tone="accent">cover</Tag>
              ) : (
                <ActionForm action={coverAction} submit="Make cover" variant="ghost" inline>
                  <input type="hidden" name="id" value={i.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                </ActionForm>
              )}
              <ActionForm
                action={removeImageAction}
                submit="Remove"
                variant="ghost"
                inline
                confirm="Remove this screenshot?"
              >
                <input type="hidden" name="id" value={i.id} />
              </ActionForm>
            </span>
          </div>
        ))}
        {!images.length ? <p className="mk-muted">No screenshots yet.</p> : null}
        <ShotUploader projectId={project.id} />
      </section>
      <section className="st-card" aria-labelledby="danger">
        <h2 id="danger">Delete this project</h2>
        <ActionForm
          action={deleteProjectAction}
          submit="Delete project"
          variant="danger"
          confirm={`Delete ${project.title}?`}
        >
          <input type="hidden" name="id" value={project.id} />
        </ActionForm>
      </section>
    </>
  );
}
