import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../src/client";
import * as forms from "../src/forms";
import * as schema from "../src/schema";
import * as st from "../src/studio";

const here = path.dirname(fileURLToPath(import.meta.url));
let db: Database;
let jobId: string;
beforeAll(async () => {
  const d = drizzle(await PGlite.create(), { schema, casing: "snake_case" });
  await migrate(d, { migrationsFolder: path.join(here, "../drizzle") });
  db = d as unknown as Database;
  const c = await st.createClient(db, { name: "Form Client", email: "form@example.com" });
  jobId = (
    await st.createJob(db, {
      clientId: c.id,
      title: "School concert",
      date: "2027-04-02",
      location: "Brooklyn",
      feeCents: 40000,
    })
  ).id;
  await forms.seedSampleTemplates(db);
  await forms.seedSampleQuestionnaires(db);
});
const tpl = async (slug: string) => (await forms.listTemplates(db)).find((t) => t.slug === slug)!;

describe("merge fields", () => {
  it("fills known fields, flags missing ones, and never evaluates anything", () => {
    const r = forms.mergeText("Hi {{client_name}} {{ job_title }} {{unknown}} {{fee}} ${1+1} {{constructor}}", {
      client_name: "Ada",
      job_title: "Shoot",
    });
    expect(r.text).toContain("Hi Ada Shoot {{unknown}} [fee: TODO] ${1+1} {{constructor}}");
    expect(r.missing.sort()).toEqual(["constructor", "fee", "unknown"]);
  });
  it("the gallery clause quotes the policy and shows $XX for a sample fee", async () => {
    const p = await forms.getPolicies(db);
    expect(forms.galleryPolicyText(p)).toContain("3 months");
    expect(forms.galleryPolicyText(p)).toContain("$XX");
    const set = await forms.savePolicies(db, {
      extensionFeeCents: 3000,
      extensionFeeIsSample: false,
      galleryAccessMonths: 6,
    });
    expect(forms.galleryPolicyText(set)).toContain("$30.00");
    expect(forms.galleryPolicyText(set)).toContain("6 months");
    await forms.savePolicies(db, { extensionFeeIsSample: true, galleryAccessMonths: 3 });
  });
});

describe("contracts from templates", () => {
  it("merges the job, client and policies, records usage rights and a licence end date", async () => {
    const { contract, missing } = await forms.createContractFromTemplate(db, {
      jobId,
      templateId: (await tpl("licence")).id,
    });
    expect(contract.body).toContain("Form Client");
    expect(contract.body).toContain("School concert");
    expect(contract.body).toContain("$400.00");
    expect(contract.body).toContain("SAMPLE ONLY");
    expect(contract.usageRights).toMatchObject({ commercial: true, termMonths: 12 });
    expect(contract.licenseExpiresAt && contract.licenseExpiresAt > new Date()).toBe(true);
    expect(missing).toEqual([]);
    const ev = await forms.createContractFromTemplate(db, { jobId, templateId: (await tpl("event")).id });
    expect(ev.contract.body).toContain("Your online gallery stays available for 3 months");
    expect(ev.contract.body).toContain("on 2027-04-02 at Brooklyn");
  });

  it("a release needs a subject; a minor release needs a guardian to sign, and consent to e-sign is recorded", async () => {
    const model = await tpl("model-release");
    await expect(forms.createContractFromTemplate(db, { jobId, templateId: model.id })).rejects.toThrow(/who or what/);
    const { contract } = await forms.createContractFromTemplate(db, {
      jobId,
      templateId: model.id,
      subject: "Sam Student",
      minor: true,
      signerEmail: "Parent@Example.com",
    });
    expect(contract).toMatchObject({
      kind: "model-release",
      minor: true,
      subject: "Sam Student",
      signerEmail: "parent@example.com",
    });
    const { token } = await st.sendContract(db, contract.id);
    await expect(
      st.signContract(db, token, { signerName: "Sam Student", agree: true, consentElectronic: true }),
    ).rejects.toThrow(/guardian/);
    await expect(
      st.signContract(db, token, { signerName: "Pat Parent", agree: true, guardianName: "Pat Parent" }),
    ).rejects.toThrow(/electronically/);
    const signed = await st.signContract(db, token, {
      signerName: "Pat Parent",
      agree: true,
      consentElectronic: true,
      guardianName: "Pat Parent",
      ipHash: "x",
    });
    expect(signed).toMatchObject({ status: "signed", guardianName: "Pat Parent", consentElectronic: true });
    expect(signed.documentSha256).toHaveLength(64);
  });

  it("template validation", async () => {
    await expect(
      forms.saveTemplate(db, { name: "x", kind: "contract", body: "long enough text here for a template body" }),
    ).rejects.toThrow();
    await expect(
      forms.saveTemplate(db, { name: "Good", kind: "nope", body: "long enough text here for a template body" }),
    ).rejects.toThrow(/kind/);
    const t = await forms.saveTemplate(db, {
      name: "Mine",
      kind: "contract",
      body: "Hello {{client_name}}, this is my own template.",
    });
    expect(t.isSample).toBe(false);
  });
});

describe("questionnaires", () => {
  it("validates the field list", () => {
    expect(() => forms.parseFields([])).toThrow(/at least one/);
    expect(() => forms.parseFields([{ id: "a", label: "Q one", type: "choice" }])).toThrow(/needs options/);
    expect(() =>
      forms.parseFields([
        { id: "a", label: "Q one", type: "text" },
        { id: "a", label: "Q two", type: "text" },
      ]),
    ).toThrow(/share the id/);
    expect(forms.parseFields([{ id: "a", label: "Q one", type: "yesno" }])).toHaveLength(1);
  });

  it("send, answer once with validation against the snapshot, and edits do not change what was sent", async () => {
    const q = (await forms.listQuestionnaires(db)).find((x) => x.slug === "event-details")!;
    const [client] = await db.select().from(schema.studioClients);
    const { send, token } = await forms.sendQuestionnaire(db, { questionnaireId: q.id, clientId: client.id, jobId });
    await forms.saveQuestionnaire(db, {
      id: q.id,
      name: q.name,
      fields: [{ id: "only", label: "Changed later", type: "text" }],
    });
    expect((await forms.questionnaireByToken(db, token))?.fields).toHaveLength(6);
    await expect(forms.submitQuestionnaire(db, token, {})).rejects.toThrow(/Please answer/);
    await expect(
      forms.submitQuestionnaire(db, token, { start: "3pm", must: "Cake", kids: "Maybe", contact: "Pat 555" }),
    ).rejects.toThrow(/Yes or No/);
    const done = await forms.submitQuestionnaire(db, token, {
      start: "3pm to 6pm",
      must: "Cake",
      kids: "Yes",
      contact: "Pat 555",
      extra: "ignored",
    });
    expect(done.answers).toEqual({ start: "3pm to 6pm", must: "Cake", kids: "Yes", contact: "Pat 555" });
    await expect(
      forms.submitQuestionnaire(db, token, { start: "x", must: "x", kids: "No", contact: "x" }),
    ).rejects.toThrow(/already sent/);
    expect(send.title).toBe("Event details");
    expect(await forms.questionnaireByToken(db, "nope")).toBeNull();
  });
});
