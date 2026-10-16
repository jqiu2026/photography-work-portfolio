"use client";

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
          <p className="st-note">
            Merge fields: client_name, client_email, job_title, job_date, location, fee, deposit, business_name,
            gallery_policy, cancellation_days, today, subject, guardian. Shipped templates are SAMPLES: have a lawyer
            review them.
          </p>
          <ul className="st-list st-list--tall">
            {data.templates.map((t) => (
              <li key={t.id} data-template-id={t.id}>
                <span>
                  <strong>{t.name}</strong> · {t.kind} {t.isSample ? <em>SAMPLE</em> : null}
                  <small>{t.body.slice(0, 110).replace(/\n+/g, " ")}…</small>
                </span>
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
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
                </button>
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
            <label>
              Name
              <input value={f.tname ?? ""} onChange={set("tname")} />
            </label>
            <label>
              Kind
              <select value={f.tkind ?? "contract"} onChange={set("tkind")}>
                {KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label>
              Text (use {"{{field}}"} merge fields)
              <textarea rows={8} value={f.tbody ?? ""} onChange={set("tbody")} />
            </label>
            <label className="st-check">
              <input
                type="checkbox"
                checked={flags.personal}
                onChange={(e) => setFlags({ ...flags, personal: e.target.checked })}
              />{" "}
              Licence: personal use
            </label>
            <label className="st-check">
              <input
                type="checkbox"
                checked={flags.commercial}
                onChange={(e) => setFlags({ ...flags, commercial: e.target.checked })}
              />{" "}
              Licence: commercial use
            </label>
            <label>
              Licence term (months, blank = no end)
              <input inputMode="numeric" value={f.tterm ?? ""} onChange={set("tterm")} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              {f.tid ? "Save template" : "Add template"}
            </button>
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
            <label>
              Job
              <select value={f.cfj ?? ""} onChange={set("cfj")}>
                <option value="">Pick a job</option>
                {data.jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Template
              <select value={f.cft ?? ""} onChange={set("cft")}>
                <option value="">Pick a template</option>
                {data.templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            {release ? (
              <>
                <label>
                  Who or what it covers
                  <input value={f.cfs ?? ""} onChange={set("cfs")} />
                </label>
                <label className="st-check">
                  <input
                    type="checkbox"
                    checked={flags.minor}
                    onChange={(e) => setFlags({ ...flags, minor: e.target.checked })}
                  />{" "}
                  The subject is under 18 (a guardian must sign)
                </label>
                <label>
                  Signer email (if not the client)
                  <input value={f.cfe ?? ""} onChange={set("cfe")} />
                </label>
              </>
            ) : null}
            <button type="submit" className="st-btn" disabled={pending}>
              Create draft
            </button>
          </form>
        </Card>

        <Card title="Questionnaires" id="f-q">
          <ul className="st-list st-list--tall">
            {data.questionnaires.map((q) => (
              <li key={q.id} data-questionnaire-id={q.id}>
                <span>
                  <strong>{q.name}</strong> {q.isSample ? <em>SAMPLE</em> : null}
                  <small>{q.fields.length} questions</small>
                </span>
                <button
                  type="button"
                  className="st-btn st-btn--ghost"
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
                </button>
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
            <label>
              Name
              <input value={f.qname ?? ""} onChange={set("qname")} />
            </label>
            <label>
              Description
              <input value={f.qdesc ?? ""} onChange={set("qdesc")} />
            </label>
            <label>
              Questions, one per line: label | type | options (type is text, longtext, choice, yesno or date; end the
              label with * if required)
              <textarea rows={6} value={f.qfields ?? ""} onChange={set("qfields")} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              {f.qid ? "Save questionnaire" : "Add questionnaire"}
            </button>
          </form>
          <form
            noValidate
            className="st-form"
            aria-label="Send questionnaire"
            onSubmit={submit(() =>
              sendQuestionnaireAction({ questionnaireId: f.sq ?? "", clientId: f.sc ?? "", jobId: f.sj }),
            )}
          >
            <label>
              Questionnaire
              <select value={f.sq ?? ""} onChange={set("sq")}>
                <option value="">Pick one</option>
                {data.questionnaires.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Client
              <select value={f.sc ?? ""} onChange={set("sc")}>
                <option value="">Pick a client</option>
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Job (optional)
              <select value={f.sj ?? ""} onChange={set("sj")}>
                <option value="">None</option>
                {data.jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Send
            </button>
          </form>
        </Card>

        <Card title="Answers" id="f-ans">
          {data.sends.length ? (
            <ul className="st-list st-list--tall">
              {data.sends.map((s) => (
                <li key={s.id} data-send-id={s.id}>
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
                      <p className="st-note">No answers yet.</p>
                    )}
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">Nothing sent yet.</p>
          )}
        </Card>

        <Card title="Gallery and cancellation policies" id="f-pol">
          <p className="st-note">
            These fill the gallery clause in every contract and the Terms page.
            {data.policies.sample ? " The extension fee is a SAMPLE until you save it." : ""}
          </p>
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
            <label>
              Business name
              <input value={f.pb ?? data.policies.businessName} onChange={set("pb")} />
            </label>
            <label>
              Gallery access included (months)
              <input
                inputMode="numeric"
                value={f.pg ?? String(data.policies.galleryAccessMonths)}
                onChange={set("pg")}
              />
            </label>
            <label>
              Extension period (months)
              <input inputMode="numeric" value={f.pe ?? String(data.policies.extensionMonths)} onChange={set("pe")} />
            </label>
            <label>
              Extension and reactivation fee (dollars)
              <input inputMode="decimal" value={f.pf ?? data.policies.extensionFee} onChange={set("pf")} />
            </label>
            <label>
              Cancellation window (days)
              <input inputMode="numeric" value={f.pc ?? String(data.policies.cancellationDays)} onChange={set("pc")} />
            </label>
            <button type="submit" className="st-btn" disabled={pending}>
              Save
            </button>
          </form>
        </Card>
      </div>
    </Frame>
  );
}
