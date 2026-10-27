import { saveProjectAction } from "@/app/studio/actions";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { linksToText } from "@/lib/links";
import { ActionForm } from "./ActionForm";

type P = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  status: string;
  year: number | null;
  role: string | null;
  stack: string[];
  links: { label: string; url: string; kind: string }[];
  lessons: string | null;
  published: boolean;
};

export function ProjectForm({ project }: { project?: P }) {
  return (
    <ActionForm action={saveProjectAction} submit={project ? "Save project" : "Create project"}>
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
      <Field label="Title">
        <Input name="title" defaultValue={project?.title} required maxLength={120} />
      </Field>
      <div className="st-grid2">
        <Field label="Address" hint={project ? undefined : "Made from the title if empty."}>
          <Input name="slug" defaultValue={project?.slug} maxLength={80} />
        </Field>
        <Field label="Year">
          <Input name="year" type="number" min={1990} max={2200} defaultValue={project?.year ?? ""} />
        </Field>
        <Field label="Where it stands">
          <Select
            name="status"
            defaultValue={project?.status ?? "building"}
            options={[
              { value: "building", label: "Bench: building now" },
              { value: "shipped", label: "Shelf: finished and working" },
              { value: "archived", label: "Scrap bin: stopped" },
            ]}
          />
        </Field>
      </div>
      <Field label="One-line summary" hint="Shown on cards (300 characters).">
        <Textarea name="summary" rows={2} defaultValue={project?.summary ?? ""} maxLength={300} />
      </Field>
      <Field
        label="My part"
        hint="For example: designed and built it alone. First name or handle only for other people."
      >
        <Input name="role" defaultValue={project?.role ?? ""} maxLength={120} />
      </Field>
      <Field label="Tools" hint="Comma separated: TypeScript, Postgres, Figma.">
        <Input name="stack" defaultValue={project?.stack.join(", ") ?? ""} />
      </Field>
      <Field label="Links" hint="One per line: label | https://address | demo, source, writeup or other.">
        <Textarea name="links" rows={3} defaultValue={project ? linksToText(project.links) : ""} />
      </Field>
      <Field
        label="Write-up (Markdown)"
        hint="What it is, how it works. No raw HTML; screenshots are added below, after they are checked."
      >
        <Textarea name="body" rows={12} defaultValue={project?.body ?? ""} maxLength={20000} />
      </Field>
      <Field label="What I learned">
        <Textarea name="lessons" rows={3} defaultValue={project?.lessons ?? ""} maxLength={2000} />
      </Field>
      <Checkbox name="published" defaultChecked={project?.published} label="Published in the showcase" />
    </ActionForm>
  );
}
