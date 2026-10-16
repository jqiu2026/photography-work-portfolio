import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getStudioSetting, setStudioSetting } from "./calendar";
import type { Database } from "./client";
import { StudioError } from "./errors";
import { formatMoney } from "./pricing";
import * as s from "./schema";
import { hashToken, newToken } from "./studio-crypto";

/**
 * Contract and release templates with merge fields, the policies they quote (gallery access and reactivation), and
 * questionnaires. NOT legal advice: every shipped template is a sample for a lawyer to review (`is_sample`).
 */

/* ---------- policies (also shown on the Terms page) ---------- */
export const policiesSchema = z.object({
  businessName: z.string().default("Jerry Qiu Photography"),
  galleryAccessMonths: z.number().int().min(1).max(60).default(3),
  extensionMonths: z.number().int().min(1).max(60).default(3),
  /** SAMPLE until the owner sets it (Q61). */
  extensionFeeCents: z.number().int().min(0).default(3000),
  extensionFeeIsSample: z.boolean().default(true),
  cancellationDays: z.number().int().min(0).max(365).default(14),
});
export type Policies = z.infer<typeof policiesSchema>;
export const getPolicies = (db: Database) => getStudioSetting(db, "policies", policiesSchema);
export async function savePolicies(db: Database, patch: Partial<Policies>) {
  const next = policiesSchema.parse({ ...(await getPolicies(db)), ...patch });
  await setStudioSetting(db, "policies", next);
  return next;
}

/** The gallery clause every contract can quote (F-45): access period, extension price, reactivation. */
export function galleryPolicyText(p: Policies): string {
  const fee = p.extensionFeeIsSample ? "$XX" : formatMoney(p.extensionFeeCents);
  return `Your online gallery stays available for ${p.galleryAccessMonths} months after delivery. After that it is archived. You can extend access for ${fee} per additional ${p.extensionMonths} months, and an archived gallery can be reactivated for the same fee. Download your photographs before the gallery expires if you want to keep them.`;
}

/* ---------- merge fields ---------- */
export type MergeVars = Partial<Record<(typeof MERGE_FIELDS)[number], string>>;
export const MERGE_FIELDS = [
  "client_name",
  "client_email",
  "job_title",
  "job_date",
  "location",
  "fee",
  "deposit",
  "business_name",
  "gallery_policy",
  "cancellation_days",
  "today",
  "subject",
  "guardian",
] as const;

/** Replaces `{{field}}` for known fields only. Anything else stays visible and is reported, never executed. */
export function mergeText(body: string, vars: MergeVars): { text: string; missing: string[] } {
  const missing = new Set<string>();
  const text = body.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (whole, key: string) => {
    if (!(MERGE_FIELDS as readonly string[]).includes(key)) {
      missing.add(key);
      return whole;
    }
    const v = vars[key as (typeof MERGE_FIELDS)[number]];
    if (v === undefined || v === "") {
      missing.add(key);
      return `[${key.replace(/_/g, " ")}: TODO]`;
    }
    return v;
  });
  return { text, missing: [...missing] };
}

/* ---------- templates ---------- */
const SAMPLE_BANNER = "SAMPLE ONLY: have a lawyer review this before you use it.\n\n";
const common = `Parties. This agreement is between {{business_name}} ("the photographer") and {{client_name}} ({{client_email}}) ("the client").

Job. {{job_title}}{{job_date}}{{location}}.

Fee. The fee is {{fee}}. A deposit of {{deposit}} holds the date and is due when you sign.

Gallery access. {{gallery_policy}}

Cancellation. If you cancel more than {{cancellation_days}} days before the shoot the deposit is refunded less any costs already incurred; later than that the deposit is kept. TODO(owner): confirm.

Copyright and licence. The photographer keeps the copyright. The client receives the licence described below.

Electronic signature. Typing your name below is your signature. You agree to sign and keep records electronically.`;

export const SAMPLE_TEMPLATES: {
  slug: string;
  name: string;
  kind: string;
  body: string;
  usageRights: s.StudioContractTemplate["usageRights"];
}[] = [
  {
    slug: "event",
    name: "Event photography agreement",
    kind: "contract",
    usageRights: { personal: true, commercial: false, termMonths: null },
    body: `${SAMPLE_BANNER}EVENT PHOTOGRAPHY AGREEMENT\n\n${common}\n\nLicence. Personal, non-commercial use, with no end date. The client may share photographs online with credit. Commercial use needs a separate licence.`,
  },
  {
    slug: "wedding",
    name: "Wedding photography agreement",
    kind: "contract",
    usageRights: { personal: true, commercial: false, termMonths: null },
    body: `${SAMPLE_BANNER}WEDDING PHOTOGRAPHY AGREEMENT\n\n${common}\n\nTimeline. The client will share a schedule at least two weeks before the day. Coverage ends at the agreed time unless extended.\n\nLicence. Personal, non-commercial use, with no end date.`,
  },
  {
    slug: "portrait",
    name: "Portrait session agreement",
    kind: "contract",
    usageRights: { personal: true, commercial: false, termMonths: null },
    body: `${SAMPLE_BANNER}PORTRAIT SESSION AGREEMENT\n\n${common}\n\nLicence. Personal, non-commercial use, with no end date.`,
  },
  {
    slug: "licence",
    name: "Photograph licence",
    kind: "licence",
    usageRights: { personal: false, commercial: true, termMonths: 12 },
    body: `${SAMPLE_BANNER}PHOTOGRAPH LICENCE\n\nBetween {{business_name}} and {{client_name}} ({{client_email}}).\n\nWork. {{job_title}}.\n\nGrant. A non-exclusive licence to reproduce the work for the stated use, for 12 months from signing, in the stated territory. All other rights are reserved. The photographer must be credited where the use allows. TODO(owner): territory, media and credit line.\n\nFee. {{fee}}.\n\nElectronic signature. Typing your name below is your signature.`,
  },
  {
    slug: "model-release",
    name: "Model release",
    kind: "model-release",
    usageRights: null,
    body: `${SAMPLE_BANNER}MODEL RELEASE\n\nI, the person named below, allow {{business_name}} to photograph me ({{subject}}) at {{job_title}} and to use the photographs in the photographer's portfolio, website, social media and promotional material. I will not be paid. I may ask for a photograph to be removed from future use by emailing the photographer; this does not undo uses already made.\n\nIf the subject is under 18, a parent or legal guardian signs for them ({{guardian}}).\n\nElectronic signature. Typing your name below is your signature.`,
  },
  {
    slug: "property-release",
    name: "Property release",
    kind: "property-release",
    usageRights: null,
    body: `${SAMPLE_BANNER}PROPERTY RELEASE\n\nI own or control the property described below ({{subject}}) and allow {{business_name}} to photograph it and use the photographs in the photographer's portfolio, website and promotional material. TODO(owner): any limits (no address shown, and so on).\n\nElectronic signature. Typing your name below is your signature.`,
  },
  {
    slug: "parental-consent",
    name: "Parental consent (photographing a minor)",
    kind: "parental-consent",
    usageRights: null,
    body: `${SAMPLE_BANNER}PARENTAL OR GUARDIAN CONSENT\n\nI am the parent or legal guardian of {{subject}}. I give {{business_name}} permission to photograph them at {{job_title}} and to use the photographs in the photographer's portfolio and website. Galleries containing minors are kept private by default, and face search is never used on them without a separate consent.\n\nElectronic signature. Typing your name below is your signature.`,
  },
];

export async function seedSampleTemplates(db: Database): Promise<boolean> {
  const [any] = await db.select({ id: s.studioContractTemplates.id }).from(s.studioContractTemplates).limit(1);
  if (any) return false;
  for (const t of SAMPLE_TEMPLATES)
    await db
      .insert(s.studioContractTemplates)
      .values({ ...t, isSample: true })
      .onConflictDoNothing();
  return true;
}

export async function listTemplates(db: Database) {
  return db
    .select()
    .from(s.studioContractTemplates)
    .where(isNull(s.studioContractTemplates.deletedAt))
    .orderBy(asc(s.studioContractTemplates.kind), asc(s.studioContractTemplates.name));
}

export async function saveTemplate(
  db: Database,
  t: {
    id?: string;
    name: string;
    kind: string;
    body: string;
    usageRights?: s.StudioContractTemplate["usageRights"];
    isSample?: boolean;
  },
) {
  if (t.name.trim().length < 2) throw new StudioError("Name the template.");
  if (t.body.trim().length < 20) throw new StudioError("The template text is too short.");
  const kinds = ["contract", "licence", "model-release", "property-release", "parental-consent"];
  if (!kinds.includes(t.kind)) throw new StudioError("Pick a kind.");
  const values = {
    name: t.name.trim().slice(0, 100),
    kind: t.kind,
    body: t.body,
    usageRights: t.usageRights ?? null,
    isSample: t.isSample ?? false,
    updatedAt: new Date(),
  };
  if (t.id) {
    const [row] = await db
      .update(s.studioContractTemplates)
      .set(values)
      .where(eq(s.studioContractTemplates.id, t.id))
      .returning();
    if (!row) throw new StudioError("Unknown template.");
    return row;
  }
  const slug = `${t.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await db
    .insert(s.studioContractTemplates)
    .values({ ...values, slug })
    .returning();
  return row;
}

/** A contract (or release) for a job, from a template: merged with the job, client and policies. Draft until sent. */
export async function createContractFromTemplate(
  db: Database,
  input: {
    jobId: string;
    templateId: string;
    subject?: string;
    minor?: boolean;
    guardianName?: string;
    signerEmail?: string;
    depositCents?: number;
  },
  by?: string,
  now = new Date(),
) {
  const [tpl] = await db
    .select()
    .from(s.studioContractTemplates)
    .where(eq(s.studioContractTemplates.id, input.templateId));
  if (!tpl) throw new StudioError("Pick a template.");
  const [row] = await db
    .select({ job: s.studioJobs, client: s.studioClients })
    .from(s.studioJobs)
    .innerJoin(s.studioClients, eq(s.studioClients.id, s.studioJobs.clientId))
    .where(eq(s.studioJobs.id, input.jobId));
  if (!row) throw new StudioError("Unknown job.");
  const p = await getPolicies(db);
  const isRelease = tpl.kind !== "contract" && tpl.kind !== "licence";
  if (isRelease && !input.subject?.trim()) throw new StudioError("Say who or what the release covers.");
  const merged = mergeText(tpl.body, {
    client_name: row.client.name,
    client_email: row.client.email,
    job_title: row.job.title,
    job_date: row.job.date ? ` on ${row.job.date}` : "",
    location: row.job.location ? ` at ${row.job.location}` : "",
    fee: row.job.feeCents ? formatMoney(row.job.feeCents) : "TODO(owner)",
    deposit: formatMoney(input.depositCents ?? Math.round(row.job.feeCents * 0.3)),
    business_name: p.businessName,
    gallery_policy: galleryPolicyText(p),
    cancellation_days: String(p.cancellationDays),
    today: now.toISOString().slice(0, 10),
    subject: input.subject?.trim() || row.client.name,
    guardian: input.minor
      ? input.guardianName?.trim()
        ? input.guardianName.trim()
        : "name to be typed by the guardian"
      : "not needed",
  });
  const months = tpl.usageRights?.termMonths ?? null;
  const [c] = await db
    .insert(s.studioContracts)
    .values({
      jobId: row.job.id,
      title: tpl.name,
      body: merged.text,
      kind: tpl.kind,
      templateId: tpl.id,
      subject: isRelease ? (input.subject?.trim() ?? null) : null,
      minor: Boolean(input.minor),
      guardianName: input.guardianName?.trim() || null,
      signerEmail: (input.signerEmail ?? row.client.email).trim().toLowerCase(),
      usageRights: tpl.usageRights ?? null,
      licenseExpiresAt: months ? new Date(now.getTime() + months * 30.4375 * 86_400_000) : null,
      updatedBy: by,
    })
    .returning();
  return { contract: c, missing: merged.missing };
}

/* ---------- questionnaires ---------- */
export const SAMPLE_QUESTIONNAIRES: { slug: string; name: string; description: string; fields: s.QuestionField[] }[] = [
  {
    slug: "event-details",
    name: "Event details",
    description: "A few questions so I can prepare for your event.",
    fields: [
      { id: "start", label: "What time does the event start and end?", type: "text", required: true },
      { id: "venue", label: "Venue and parking or access notes", type: "longtext" },
      { id: "must", label: "Moments or people that must be photographed", type: "longtext", required: true },
      { id: "kids", label: "Will children be photographed?", type: "yesno", required: true },
      { id: "privacy", label: "Anyone who should NOT be photographed or shown online?", type: "longtext" },
      { id: "contact", label: "Who is my contact on the day (name and phone)?", type: "text", required: true },
    ],
  },
  {
    slug: "portrait-prep",
    name: "Portrait session prep",
    description: "Helps me plan the look and the location.",
    fields: [
      {
        id: "use",
        label: "What will the photographs be used for?",
        type: "choice",
        options: ["Personal", "Headshot / professional", "Social media", "Family", "Other"],
        required: true,
      },
      { id: "look", label: "Describe the look you like", type: "longtext" },
      { id: "comfort", label: "Anything that makes you uncomfortable in photos?", type: "longtext" },
      { id: "date", label: "Any dates to avoid", type: "date" },
    ],
  },
];

export async function seedSampleQuestionnaires(db: Database): Promise<boolean> {
  const [any] = await db.select({ id: s.studioQuestionnaires.id }).from(s.studioQuestionnaires).limit(1);
  if (any) return false;
  for (const q of SAMPLE_QUESTIONNAIRES)
    await db
      .insert(s.studioQuestionnaires)
      .values({ ...q, isSample: true })
      .onConflictDoNothing();
  return true;
}
export async function listQuestionnaires(db: Database) {
  return db
    .select()
    .from(s.studioQuestionnaires)
    .where(isNull(s.studioQuestionnaires.deletedAt))
    .orderBy(asc(s.studioQuestionnaires.name));
}

const fieldSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]{1,30}$/),
  label: z.string().trim().min(2).max(200),
  type: z.enum(["text", "longtext", "choice", "yesno", "date"]),
  required: z.boolean().optional(),
  options: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  hint: z.string().max(200).optional(),
});
export function parseFields(input: unknown): s.QuestionField[] {
  const r = z.array(fieldSchema).min(1, "Add at least one question.").max(40).safeParse(input);
  if (!r.success) throw new StudioError(r.error.issues[0].message);
  const ids = new Set<string>();
  for (const f of r.data) {
    if (ids.has(f.id)) throw new StudioError(`Two questions share the id "${f.id}".`);
    ids.add(f.id);
    if (f.type === "choice" && !f.options?.length) throw new StudioError(`"${f.label}" needs options.`);
  }
  return r.data;
}

export async function saveQuestionnaire(
  db: Database,
  q: { id?: string; name: string; description?: string; fields: unknown },
) {
  if (q.name.trim().length < 2) throw new StudioError("Name the questionnaire.");
  const fields = parseFields(q.fields);
  const values = {
    name: q.name.trim().slice(0, 100),
    description: q.description?.trim().slice(0, 300) || null,
    fields,
    isSample: false,
    updatedAt: new Date(),
  };
  if (q.id) {
    const [row] = await db
      .update(s.studioQuestionnaires)
      .set(values)
      .where(eq(s.studioQuestionnaires.id, q.id))
      .returning();
    if (!row) throw new StudioError("Unknown questionnaire.");
    return row;
  }
  const slug = `${q.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)}-${Math.random().toString(36).slice(2, 6)}`;
  const [row] = await db
    .insert(s.studioQuestionnaires)
    .values({ ...values, slug })
    .returning();
  return row;
}

export async function sendQuestionnaire(
  db: Database,
  input: { questionnaireId: string; clientId: string; jobId?: string | null },
  now = new Date(),
) {
  const [q] = await db
    .select()
    .from(s.studioQuestionnaires)
    .where(eq(s.studioQuestionnaires.id, input.questionnaireId));
  if (!q) throw new StudioError("Pick a questionnaire.");
  const [c] = await db.select().from(s.studioClients).where(eq(s.studioClients.id, input.clientId));
  if (!c) throw new StudioError("Pick a client.");
  const { token, hash } = newToken();
  const [row] = await db
    .insert(s.studioQuestionnaireSends)
    .values({
      questionnaireId: q.id,
      clientId: c.id,
      jobId: input.jobId ?? null,
      fields: q.fields,
      title: q.name,
      tokenHash: hash,
      sentAt: now,
    })
    .returning();
  return { send: row, token, client: c };
}
export async function questionnaireByToken(db: Database, token: string) {
  const [row] = await db
    .select()
    .from(s.studioQuestionnaireSends)
    .where(eq(s.studioQuestionnaireSends.tokenHash, hashToken(token)));
  return row ?? null;
}

/** Validates answers against the snapshot of questions that were sent (required, choice options, lengths). Completes once. */
export async function submitQuestionnaire(db: Database, token: string, raw: Record<string, string>, now = new Date()) {
  const send = await questionnaireByToken(db, token);
  if (!send) throw new StudioError("This link is not valid.");
  if (send.completedAt) throw new StudioError("You already sent your answers. Thank you.");
  const answers: Record<string, string> = {};
  for (const f of send.fields) {
    const v = String(raw[f.id] ?? "").trim();
    if (!v) {
      if (f.required) throw new StudioError(`Please answer: ${f.label}`);
      continue;
    }
    if (f.type === "choice" && !f.options?.includes(v))
      throw new StudioError(`Pick one of the options for: ${f.label}`);
    if (f.type === "yesno" && !["Yes", "No"].includes(v)) throw new StudioError(`Answer Yes or No: ${f.label}`);
    if (f.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new StudioError(`Pick a date: ${f.label}`);
    answers[f.id] = v.slice(0, f.type === "longtext" ? 3000 : 300);
  }
  const rows = await db
    .update(s.studioQuestionnaireSends)
    .set({ answers, completedAt: now })
    .where(and(eq(s.studioQuestionnaireSends.id, send.id), isNull(s.studioQuestionnaireSends.completedAt)))
    .returning();
  if (!rows.length) throw new StudioError("You already sent your answers. Thank you.");
  return rows[0];
}
export async function listSends(db: Database) {
  return db
    .select({ send: s.studioQuestionnaireSends, client: s.studioClients })
    .from(s.studioQuestionnaireSends)
    .innerJoin(s.studioClients, eq(s.studioClients.id, s.studioQuestionnaireSends.clientId))
    .orderBy(desc(s.studioQuestionnaireSends.sentAt));
}

void sql;
