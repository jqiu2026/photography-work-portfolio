"use client";

import { Badge, Button, Checkbox, Field, Input, Select, Text, Textarea } from "@holominimal/ui";

import { useState } from "react";
import {
  createFromTemplateAction,
  savePoliciesAction,
  saveQuestionnaireAction,
  saveTemplateAction,
  sendQuestionnaireAction,
} from "@/app/studio/forms-actions";
import { Card, FormDialog, Frame, useAct, useNotify } from "./StudioFrame";
import "./records.css";

export type FormsData = {
  templates: {
    id: string;
    name: string;
    kind: string;
    body: string;
    isSample: boolean;
    termMonths: number | null;
    personal: boolean;
    commercial: boolean;
  }[];
  questionnaires: {
    id: string;
    name: string;
    description: string | null;
    isSample: boolean;
    fields: { id: string; label: string; type: string; required?: boolean; options?: string[] }[];
  }[];
  sends: {
    id: string;
    title: string;
    client: string;
    sentAt: string;
    completed: boolean;
    answers: { label: string; value: string }[];
  }[];
  jobs: { id: string; title: string }[];
  clients: { id: string; name: string }[];
  policies: {
    businessName: string;
    galleryAccessMonths: number;
    extensionMonths: number;
    extensionFee: string;
    cancellationDays: number;
    sample: boolean;
  };
};

const KINDS = ["contract", "licence", "model-release", "property-release", "parental-consent"];
const fieldsToText = (q: FormsData["questionnaires"][number]) =>
  q.fields
    .map(
      (x) => `${x.label}${x.required ? " *" : ""} | ${x.type}${x.options?.length ? ` | ${x.options.join(", ")}` : ""}`,
    )
    .join("\n");

type Dlg = "template" | "use" | "questionnaire" | "send" | "answers" | "policies" | null;

/** Contract and release templates, questionnaires (build, send, read answers), and the gallery and cancellation policies. */
export function FormsView({ user, data }: { user: string; data: FormsData }) {
  const { pending, note, go } = useAct();
  const notify = useNotify();
  const [dlg, setDlg] = useState<Dlg>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState({ minor: false, personal: true, commercial: false });
  const [read, setRead] = useState<FormsData["sends"][number] | null>(null);
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const open = (d: Dlg, fields: Record<string, string> = {}) => {
    setF(fields);
    setDlg(d);
  };
  const close = (d: Dlg) => (o: boolean) => !o && setDlg((x) => (x === d ? null : x));
  const kindOf = data.templates.find((t) => t.id === f.cft)?.kind;
  const release = kindOf !== undefined && kindOf !== "contract" && kindOf !== "licence";
  return (
    <Frame section="forms" user={user} note={note}>
      <Card
        title="Contract and release templates"
        id="f-tpl"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setFlags({ minor: false, personal: true, commercial: false });
              open("template", { tkind: "contract" });
            }}
          >
            New template
          </Button>
        }
      >
        <Text size="sm" tone="muted">
          A template is the wording of a contract, release or license, with fields that fill in from the shoot (client,
          date, fee...). Use one to make a contract for a shoot. The shipped ones are SAMPLES: have a lawyer review
          them.
        </Text>
        <ul className="rc-cards" aria-label="Templates">
          {data.templates.map((t) => (
            <li className="rc-card" key={t.id} data-template-id={t.id}>
              <div className="rc-card__head">
                <strong>{t.name}</strong>
                {t.isSample ? <Badge tone="warning">SAMPLE</Badge> : null}
              </div>
              <Badge tone="accent">{t.kind}</Badge>
              <span className="rc-muted">{t.body.slice(0, 120).replace(/\n+/g, " ")}…</span>
              <div className="rc-card__foot">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setFlags({ minor: false, personal: t.personal, commercial: t.commercial });
                    open("template", {
                      tid: t.id,
                      tname: t.name,
                      tkind: t.kind,
                      tbody: t.body,
                      tterm: t.termMonths ? String(t.termMonths) : "",
                    });
                    notify(`Loaded ${t.name}`);
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" onClick={() => open("use", { cft: t.id })}>
                  Use for a shoot
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Questionnaires"
        id="f-q"
        actions={
          <Button size="sm" onClick={() => open("questionnaire")}>
            New questionnaire
          </Button>
        }
      >
        <Text size="sm" tone="muted">
          A set of questions you email to a client, such as for a wedding or a portrait. Their answers appear below.
        </Text>
        <ul className="rc-cards" aria-label="Questionnaires">
          {data.questionnaires.map((q) => (
            <li className="rc-card" key={q.id} data-questionnaire-id={q.id}>
              <div className="rc-card__head">
                <strong>{q.name}</strong>
                {q.isSample ? <Badge tone="warning">SAMPLE</Badge> : null}
              </div>
              <span className="rc-muted">
                {q.fields.length} questions{q.description ? ` · ${q.description}` : ""}
              </span>
              <div className="rc-card__foot">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    open("questionnaire", {
                      qid: q.id,
                      qname: q.name,
                      qdesc: q.description ?? "",
                      qfields: fieldsToText(q),
                    });
                    notify(`Loaded ${q.name}`);
                  }}
                >
                  Edit
                </Button>
                <Button size="sm" onClick={() => open("send", { sq: q.id })}>
                  Send to a client
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Answers" id="f-ans">
        {data.sends.length ? (
          <ul className="rc-rows" aria-label="Answers">
            {data.sends.map((s) => (
              <li key={s.id} data-send-id={s.id}>
                <button
                  type="button"
                  className="rc-row"
                  onClick={() => setRead(s)}
                  aria-label={`Open answers: ${s.title}`}
                >
                  <span className="rc-row__main">
                    <strong>{s.title}</strong>
                    <small>
                      {s.client} · sent {s.sentAt.slice(0, 10)}
                    </small>
                  </span>
                  <Badge tone={s.completed ? "success" : "warning"}>{s.completed ? "answered" : "waiting"}</Badge>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="sm" tone="muted">
            Nothing sent yet.
          </Text>
        )}
      </Card>

      <Card
        title="Gallery and cancellation policies"
        id="f-pol"
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              open("policies", {
                pb: data.policies.businessName,
                pg: String(data.policies.galleryAccessMonths),
                pe: String(data.policies.extensionMonths),
                pf: data.policies.extensionFee,
                pc: String(data.policies.cancellationDays),
              })
            }
          >
            Change
          </Button>
        }
      >
        <Text size="sm" tone="muted">
          These fill the gallery clause in every contract and the Terms page.
          {data.policies.sample ? " The extension fee is a SAMPLE until you save it." : ""}
        </Text>
        <dl className="st-roles">
          <div>
            <dt>Business name</dt>
            <dd>{data.policies.businessName}</dd>
          </div>
          <div>
            <dt>Gallery access included</dt>
            <dd>{data.policies.galleryAccessMonths} months</dd>
          </div>
          <div>
            <dt>Extension</dt>
            <dd>
              ${data.policies.extensionFee} per {data.policies.extensionMonths} months
            </dd>
          </div>
          <div>
            <dt>Cancellation window</dt>
            <dd>{data.policies.cancellationDays} days</dd>
          </div>
        </dl>
      </Card>

      <FormDialog
        open={dlg === "template"}
        onOpenChange={close("template")}
        title={f.tid ? "Edit template" : "New template"}
        size="lg"
        submitLabel={f.tid ? "Save template" : "Add template"}
        pending={pending}
        onSubmit={() =>
          go(() =>
            saveTemplateAction({
              id: f.tid,
              name: f.tname ?? "",
              kind: f.tkind ?? "contract",
              body: f.tbody ?? "",
              personal: flags.personal,
              commercial: flags.commercial,
              termMonths: f.tterm,
            }),
          )
        }
      >
        <Field label="Name">
          <Input value={f.tname ?? ""} onChange={set("tname")} />
        </Field>
        <Field label="Kind">
          <Select value={f.tkind ?? "contract"} onValueChange={(v) => set("tkind")({ target: { value: v } })}>
            {KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
        </Field>
        <Field
          label={<>Text (use {"{{field}}"} merge fields)</>}
          hint="Fields: client_name, client_email, job_title, job_date, location, fee, deposit, business_name, gallery_policy, cancellation_days, today, subject, guardian."
        >
          <Textarea rows={12} value={f.tbody ?? ""} onChange={set("tbody")} />
        </Field>
        <Checkbox
          checked={flags.personal}
          onChange={(e) => setFlags({ ...flags, personal: e.target.checked })}
          label="License: personal use"
        />
        <Checkbox
          checked={flags.commercial}
          onChange={(e) => setFlags({ ...flags, commercial: e.target.checked })}
          label="License: commercial use"
        />
        <Field label="License term (months, blank = no end)">
          <Input inputMode="numeric" value={f.tterm ?? ""} onChange={set("tterm")} />
        </Field>
      </FormDialog>

      <FormDialog
        open={dlg === "use"}
        onOpenChange={close("use")}
        title="Make a contract from this template"
        description="It is filled in from the shoot and your policies, as a draft you can edit on the Contracts page."
        submitLabel="Create draft"
        pending={pending}
        onSubmit={() =>
          go(() =>
            createFromTemplateAction({
              jobId: f.cfj ?? "",
              templateId: f.cft ?? "",
              subject: f.cfs,
              minor: flags.minor,
              guardian: f.cfg,
              signerEmail: f.cfe,
            }),
          )
        }
      >
        <Field label="Shoot">
          <Select value={f.cfj ?? ""} onValueChange={(v) => set("cfj")({ target: { value: v } })}>
            <option value="">Pick a shoot</option>
            {data.jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Template">
          <Select value={f.cft ?? ""} onValueChange={(v) => set("cft")({ target: { value: v } })}>
            {data.templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        {release ? (
          <>
            <Field label="Who or what it covers">
              <Input value={f.cfs ?? ""} onChange={set("cfs")} />
            </Field>
            <Field label="Signer email (if not the client)">
              <Input value={f.cfe ?? ""} onChange={set("cfe")} />
            </Field>
            <Checkbox
              checked={flags.minor}
              onChange={(e) => setFlags({ ...flags, minor: e.target.checked })}
              label="The subject is under 18 (a guardian must sign)"
            />
          </>
        ) : null}
      </FormDialog>

      <FormDialog
        open={dlg === "questionnaire"}
        onOpenChange={close("questionnaire")}
        title={f.qid ? "Edit questionnaire" : "New questionnaire"}
        size="lg"
        submitLabel={f.qid ? "Save questionnaire" : "Add questionnaire"}
        pending={pending}
        onSubmit={() =>
          go(() =>
            saveQuestionnaireAction({ id: f.qid, name: f.qname ?? "", description: f.qdesc, fields: f.qfields ?? "" }),
          )
        }
      >
        <Field label="Name">
          <Input value={f.qname ?? ""} onChange={set("qname")} />
        </Field>
        <Field label="Description">
          <Input value={f.qdesc ?? ""} onChange={set("qdesc")} />
        </Field>
        <Field
          label="Questions"
          hint="One per line: label | type | options. Type is text, longtext, choice, yesno or date. End the label with * if it is required."
        >
          <Textarea rows={8} value={f.qfields ?? ""} onChange={set("qfields")} />
        </Field>
      </FormDialog>

      <FormDialog
        open={dlg === "send"}
        onOpenChange={close("send")}
        title="Send a questionnaire"
        submitLabel="Send"
        pending={pending}
        onSubmit={() =>
          go(() => sendQuestionnaireAction({ questionnaireId: f.sq ?? "", clientId: f.sc ?? "", jobId: f.sj }))
        }
      >
        <Field label="Questionnaire">
          <Select value={f.sq ?? ""} onValueChange={(v) => set("sq")({ target: { value: v } })}>
            {data.questionnaires.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Client">
          <Select value={f.sc ?? ""} onValueChange={(v) => set("sc")({ target: { value: v } })}>
            <option value="">Pick a client</option>
            {data.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Shoot (optional)">
          <Select value={f.sj ?? ""} onValueChange={(v) => set("sj")({ target: { value: v } })}>
            <option value="">None</option>
            {data.jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </Select>
        </Field>
      </FormDialog>

      <FormDialog
        open={dlg === "policies"}
        onOpenChange={close("policies")}
        title="Gallery and cancellation policies"
        pending={pending}
        onSubmit={() =>
          go(() =>
            savePoliciesAction({
              businessName: f.pb ?? "",
              galleryMonths: f.pg ?? "",
              extensionMonths: f.pe ?? "",
              extensionFee: f.pf ?? "",
              cancellationDays: f.pc ?? "",
            }),
          )
        }
      >
        <Field label="Business name">
          <Input value={f.pb ?? ""} onChange={set("pb")} />
        </Field>
        <Field label="Gallery access included (months)">
          <Input inputMode="numeric" value={f.pg ?? ""} onChange={set("pg")} />
        </Field>
        <Field label="Extension period (months)">
          <Input inputMode="numeric" value={f.pe ?? ""} onChange={set("pe")} />
        </Field>
        <Field label="Extension and reactivation fee (dollars)">
          <Input inputMode="decimal" value={f.pf ?? ""} onChange={set("pf")} />
        </Field>
        <Field label="Cancellation window (days)">
          <Input inputMode="numeric" value={f.pc ?? ""} onChange={set("pc")} />
        </Field>
      </FormDialog>

      <FormDialog
        open={read !== null}
        onOpenChange={(o) => !o && setRead(null)}
        title={read?.title ?? "Answers"}
        description={read ? `${read.client} · ${read.completed ? "answered" : "waiting for an answer"}` : undefined}
        submitLabel="Close"
        onSubmit={() => true}
      >
        {read?.answers.length ? (
          <dl className="st-answers st-wide">
            {read.answers.map((a) => (
              <div key={a.label}>
                <dt>{a.label}</dt>
                <dd>{a.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <Text size="sm" tone="muted" className="st-wide">
            No answers yet.
          </Text>
        )}
      </FormDialog>
    </Frame>
  );
}
