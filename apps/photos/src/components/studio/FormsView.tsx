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
import { Card, Frame, useAct } from "./StudioFrame";

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

/** Contract and release templates, questionnaires (build, send, read answers), and the gallery and cancellation policies. */
export function FormsView({ user, data }: { user: string; data: FormsData }) {
  const { pending, note, act, submit } = useAct();
  const [f, setF] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState({ minor: false, personal: true, commercial: false });
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const release =
    data.templates.find((t) => t.id === f.cft)?.kind !== undefined &&
    data.templates.find((t) => t.id === f.cft)?.kind !== "contract" &&
    data.templates.find((t) => t.id === f.cft)?.kind !== "licence";
  return (
    <Frame section="forms" user={user} note={note}>
      <div className="st-grid">
        <Card title="Templates" id="f-tpl">
          <Text size="sm" tone="muted">
            Merge fields: client_name, client_email, job_title, job_date, location, fee, deposit, business_name,
            gallery_policy, cancellation_days, today, subject, guardian. Shipped templates are SAMPLES: have a lawyer
            review them.
          </Text>
          <ul className="hm-data-list st-list st-list--tall">
            {data.templates.map((t) => (
              <li className="hm-data-list-item" key={t.id} data-template-id={t.id}>
                <span>
                  <strong>{t.name}</strong> · {t.kind} {t.isSample ? <Badge tone="warning">SAMPLE</Badge> : null}
                  <small>{t.body.slice(0, 110).replace(/\n+/g, " ")}…</small>
                </span>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setF((x) => ({
                      ...x,
                      tid: t.id,
                      tname: t.name,
                      tkind: t.kind,
                      tbody: t.body,
                      tterm: t.termMonths ? String(t.termMonths) : "",
                    }));
                    setFlags((x) => ({ ...x, personal: t.personal, commercial: t.commercial }));
                  }}
                >
                  Edit
                </Button>
              </li>
            ))}
          </ul>
          <form
            noValidate
            className="st-form"
            aria-label="Template"
            onSubmit={submit(
              () =>
                saveTemplateAction({
                  id: f.tid,
                  name: f.tname ?? "",
                  kind: f.tkind ?? "contract",
                  body: f.tbody ?? "",
                  personal: flags.personal,
                  commercial: flags.commercial,
                  termMonths: f.tterm,
                }),
              () => setF({}),
            )}
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
            <Field label={<>Text (use {"{{field}}"} merge fields)</>}>
              <Textarea rows={8} value={f.tbody ?? ""} onChange={set("tbody")} />
            </Field>
            <Checkbox
              checked={flags.personal}
              onChange={(e) => setFlags({ ...flags, personal: e.target.checked })}
              label="Licence: personal use"
            />
            <Checkbox
              checked={flags.commercial}
              onChange={(e) => setFlags({ ...flags, commercial: e.target.checked })}
              label="Licence: commercial use"
            />
            <Field label="Licence term (months, blank = no end)">
              <Input inputMode="numeric" value={f.tterm ?? ""} onChange={set("tterm")} />
            </Field>
            <Button type="submit" disabled={pending}>
              {f.tid ? "Save template" : "Add template"}
            </Button>
          </form>
        </Card>

        <Card title="Create a contract or release" id="f-new">
          <form
            noValidate
            className="st-form"
            aria-label="Create from template"
            onSubmit={submit(
              () =>
                createFromTemplateAction({
                  jobId: f.cfj ?? "",
                  templateId: f.cft ?? "",
                  subject: f.cfs,
                  minor: flags.minor,
                  guardian: f.cfg,
                  signerEmail: f.cfe,
                }),
              () => setF({}),
            )}
          >
            <Field label="Job">
              <Select value={f.cfj ?? ""} onValueChange={(v) => set("cfj")({ target: { value: v } })}>
                <option value="">Pick a job</option>
                {data.jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Template">
              <Select value={f.cft ?? ""} onValueChange={(v) => set("cft")({ target: { value: v } })}>
                <option value="">Pick a template</option>
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
                <Checkbox
                  checked={flags.minor}
                  onChange={(e) => setFlags({ ...flags, minor: e.target.checked })}
                  label="The subject is under 18 (a guardian must sign)"
                />
                <Field label="Signer email (if not the client)">
                  <Input value={f.cfe ?? ""} onChange={set("cfe")} />
                </Field>
              </>
            ) : null}
            <Button type="submit" disabled={pending}>
              Create draft
            </Button>
          </form>
        </Card>

        <Card title="Questionnaires" id="f-q">
          <ul className="hm-data-list st-list st-list--tall">
            {data.questionnaires.map((q) => (
              <li className="hm-data-list-item" key={q.id} data-questionnaire-id={q.id}>
                <span>
                  <strong>{q.name}</strong> {q.isSample ? <Badge tone="warning">SAMPLE</Badge> : null}
                  <small>{q.fields.length} questions</small>
                </span>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setF((x) => ({
                      ...x,
                      qid: q.id,
                      qname: q.name,
                      qdesc: q.description ?? "",
                      qfields: fieldsToText(q),
                    }))
                  }
                >
                  Edit
                </Button>
              </li>
            ))}
          </ul>
          <form
            noValidate
            className="st-form"
            aria-label="Questionnaire"
            onSubmit={submit(
              () =>
                saveQuestionnaireAction({
                  id: f.qid,
                  name: f.qname ?? "",
                  description: f.qdesc,
                  fields: f.qfields ?? "",
                }),
              () => setF({}),
            )}
          >
            <Field label="Name">
              <Input value={f.qname ?? ""} onChange={set("qname")} />
            </Field>
            <Field label="Description">
              <Input value={f.qdesc ?? ""} onChange={set("qdesc")} />
            </Field>
            <Field label="Questions, one per line: label | type | options (type is text, longtext, choice, yesno or date; end the label with * if required)">
              <Textarea rows={6} value={f.qfields ?? ""} onChange={set("qfields")} />
            </Field>
            <Button type="submit" disabled={pending}>
              {f.qid ? "Save questionnaire" : "Add questionnaire"}
            </Button>
          </form>
          <form
            noValidate
            className="st-form"
            aria-label="Send questionnaire"
            onSubmit={submit(() =>
              sendQuestionnaireAction({ questionnaireId: f.sq ?? "", clientId: f.sc ?? "", jobId: f.sj }),
            )}
          >
            <Field label="Questionnaire">
              <Select value={f.sq ?? ""} onValueChange={(v) => set("sq")({ target: { value: v } })}>
                <option value="">Pick one</option>
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
            <Field label="Job (optional)">
              <Select value={f.sj ?? ""} onValueChange={(v) => set("sj")({ target: { value: v } })}>
                <option value="">None</option>
                {data.jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" disabled={pending}>
              Send
            </Button>
          </form>
        </Card>

        <Card title="Answers" id="f-ans">
          {data.sends.length ? (
            <ul className="hm-data-list st-list st-list--tall">
              {data.sends.map((s) => (
                <li className="hm-data-list-item" key={s.id} data-send-id={s.id}>
                  <details>
                    <summary>
                      <strong>{s.title}</strong> · {s.client} · {s.completed ? "answered" : "waiting"}
                    </summary>
                    {s.answers.length ? (
                      <dl className="st-answers">
                        {s.answers.map((a) => (
                          <div key={a.label}>
                            <dt>{a.label}</dt>
                            <dd>{a.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <Text size="sm" tone="muted">
                        No answers yet.
                      </Text>
                    )}
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <Text size="sm" tone="muted">
              Nothing sent yet.
            </Text>
          )}
        </Card>

        <Card title="Gallery and cancellation policies" id="f-pol">
          <Text size="sm" tone="muted">
            These fill the gallery clause in every contract and the Terms page.
            {data.policies.sample ? " The extension fee is a SAMPLE until you save it." : ""}
          </Text>
          <form
            noValidate
            className="st-form"
            aria-label="Policies"
            onSubmit={submit(() =>
              savePoliciesAction({
                businessName: f.pb ?? data.policies.businessName,
                galleryMonths: f.pg ?? String(data.policies.galleryAccessMonths),
                extensionMonths: f.pe ?? String(data.policies.extensionMonths),
                extensionFee: f.pf ?? data.policies.extensionFee,
                cancellationDays: f.pc ?? String(data.policies.cancellationDays),
              }),
            )}
          >
            <Field label="Business name">
              <Input value={f.pb ?? data.policies.businessName} onChange={set("pb")} />
            </Field>
            <Field label="Gallery access included (months)">
              <Input
                inputMode="numeric"
                value={f.pg ?? String(data.policies.galleryAccessMonths)}
                onChange={set("pg")}
              />
            </Field>
            <Field label="Extension period (months)">
              <Input inputMode="numeric" value={f.pe ?? String(data.policies.extensionMonths)} onChange={set("pe")} />
            </Field>
            <Field label="Extension and reactivation fee (dollars)">
              <Input inputMode="decimal" value={f.pf ?? data.policies.extensionFee} onChange={set("pf")} />
            </Field>
            <Field label="Cancellation window (days)">
              <Input inputMode="numeric" value={f.pc ?? String(data.policies.cancellationDays)} onChange={set("pc")} />
            </Field>
            <Button type="submit" disabled={pending}>
              Save
            </Button>
          </form>
        </Card>
      </div>
    </Frame>
  );
}
