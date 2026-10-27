import { addMediaAction } from "@/app/studio/actions";
import { PROVIDER_LABEL } from "@/lib/embed";
import { Field, Input, Select } from "@/components/ui";
import { ActionForm } from "./ActionForm";

/** Adds a recording (an embed from a provider) or a performance, optionally tied to a piece. */
export function MediaForm({ workId, works }: { workId?: string; works?: { id: string; title: string }[] }) {
  return (
    <ActionForm action={addMediaAction} submit="Add" reset className="mu-form">
      {workId ? <input type="hidden" name="workId" value={workId} /> : null}
      <div className="st-grid2">
        <Field label="Kind">
          <Select
            name="kind"
            defaultValue="recording"
            options={[
              { value: "recording", label: "Recording (plays on the site)" },
              { value: "performance", label: "Performance (listed)" },
            ]}
          />
        </Field>
        <Field label="Title">
          <Input name="title" required />
        </Field>
        {works ? (
          <Field label="Piece (optional)">
            <Select
              name="workId"
              defaultValue=""
              options={[
                { value: "", label: "Not tied to a piece" },
                ...works.map((w) => ({ value: w.id, label: w.title })),
              ]}
            />
          </Field>
        ) : null}
      </div>
      <div className="st-grid2">
        <Field label="Provider (recordings)">
          <Select
            name="provider"
            defaultValue="youtube"
            options={Object.entries(PROVIDER_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </Field>
        <Field label="Recording id" hint="The id only, for example dQw4w9WgXcQ, not the whole link.">
          <Input name="embedId" />
        </Field>
        <Field label="Date (performances)">
          <Input name="date" type="date" />
        </Field>
      </div>
      <div className="st-grid2">
        <Field label="Venue">
          <Input name="venue" />
        </Field>
        <Field label="Ensemble">
          <Input name="ensemble" />
        </Field>
        <Field label="Note">
          <Input name="note" maxLength={400} />
        </Field>
      </div>
    </ActionForm>
  );
}
