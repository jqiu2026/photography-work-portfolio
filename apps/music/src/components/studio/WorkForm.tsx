import { RIGHTS_LABELS } from "@jerryqiu/scores";
import { saveWorkAction } from "@/app/studio/actions";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { ActionForm } from "./ActionForm";

type Work = {
  id: string;
  title: string;
  slug: string;
  year: number | null;
  forces: string | null;
  instruments: string[];
  genre: string | null;
  difficulty: string | null;
  durationSec: number | null;
  summary: string | null;
  programNote: string | null;
  rightsType: string;
  licenseOnFile: boolean;
  licenseNote: string | null;
  status: string;
  featured: boolean;
};

export function WorkForm({ work }: { work?: Work }) {
  return (
    <ActionForm action={saveWorkAction} submit={work ? "Save piece" : "Create piece"} className="mu-form">
      {work ? <input type="hidden" name="id" value={work.id} /> : null}
      <Field label="Title">
        <Input name="title" defaultValue={work?.title} required maxLength={160} />
      </Field>
      <div className="st-grid2">
        <Field label="Address" hint={work ? undefined : "Made from the title if empty."}>
          <Input name="slug" defaultValue={work?.slug} maxLength={80} />
        </Field>
        <Field label="Year">
          <Input name="year" type="number" min={1000} max={2200} defaultValue={work?.year ?? ""} />
        </Field>
        <Field label="Length (minutes)">
          <Input
            name="durationMin"
            type="number"
            step="0.5"
            min={0}
            defaultValue={work?.durationSec ? Math.round(work.durationSec / 6) / 10 : ""}
          />
        </Field>
      </div>
      <Field label="For (as written on the score)" hint="For example: 2 trumpets, horn, trombone.">
        <Input name="forces" defaultValue={work?.forces ?? ""} maxLength={200} />
      </Field>
      <div className="st-grid2">
        <Field label="Instruments (for search)" hint="Comma separated: trumpet, horn, trombone.">
          <Input name="instruments" defaultValue={work?.instruments.join(", ") ?? ""} />
        </Field>
        <Field label="Style">
          <Input name="genre" defaultValue={work?.genre ?? ""} maxLength={60} />
        </Field>
        <Field label="Difficulty">
          <Select
            name="difficulty"
            defaultValue={work?.difficulty ?? ""}
            options={[
              { value: "", label: "Not set" },
              { value: "easy", label: "Easy" },
              { value: "medium", label: "Medium" },
              { value: "advanced", label: "Advanced" },
            ]}
          />
        </Field>
      </div>
      <Field label="Short description" hint="Shown on cards and in search results (400 characters).">
        <Textarea name="summary" rows={2} defaultValue={work?.summary ?? ""} maxLength={400} />
      </Field>
      <Field label="Program note" hint="Blank line between paragraphs.">
        <Textarea name="programNote" rows={6} defaultValue={work?.programNote ?? ""} maxLength={6000} />
      </Field>
      <fieldset className="mu-stack" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="mu-h2">Rights</legend>
        <Field label="What this piece is">
          <Select
            name="rightsType"
            defaultValue={work?.rightsType ?? "original"}
            options={Object.entries(RIGHTS_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </Field>
        <Checkbox
          name="licenseOnFile"
          defaultChecked={work?.licenseOnFile}
          label="The arranging license from the rights holder is on file"
        />
        <Field label="Where the license is" hint="For your records. Not shown publicly.">
          <Input name="licenseNote" defaultValue={work?.licenseNote ?? ""} maxLength={400} />
        </Field>
        <p className="mu-muted">An arrangement of a copyrighted work is not for sale until that box is ticked.</p>
      </fieldset>
      <div className="st-grid2">
        <Field label="Status">
          <Select
            name="status"
            defaultValue={work?.status ?? "draft"}
            options={[
              { value: "draft", label: "Draft (hidden)" },
              { value: "published", label: "Published" },
            ]}
          />
        </Field>
        <Checkbox name="featured" defaultChecked={work?.featured} label="Feature on the home page" />
      </div>
    </ActionForm>
  );
}
