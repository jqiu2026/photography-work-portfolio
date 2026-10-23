"use server";

import * as forms from "@jerryqiu/db/forms";
import { StudioError } from "@jerryqiu/db/studio";
import { sendTemplate } from "@jerryqiu/email";
import { getSite } from "@jerryqiu/sites";
import { z } from "zod";
import { studioOwner } from "@/lib/studio-run";

const id = z.string().uuid();

export async function saveTemplateAction(input: {
  id?: string;
  name: string;
  kind: string;
  body: string;
  personal?: boolean;
  commercial?: boolean;
  termMonths?: string;
}) {
  return studioOwner(async ({ db }) => {
    const months = input.termMonths?.trim() ? Number(input.termMonths) : null;
    if (months !== null && (!Number.isInteger(months) || months < 1 || months > 600))
      throw new StudioError("The license term is a whole number of months.");
    const t = await forms.saveTemplate(db, {
      id: input.id && id.safeParse(input.id).success ? input.id : undefined,
      name: input.name,
      kind: input.kind,
      body: input.body,
      usageRights:
        input.kind === "contract" || input.kind === "licence"
          ? { personal: input.personal ?? true, commercial: input.commercial ?? false, termMonths: months }
          : null,
    });
    return {
      message: "Template saved",
      audit: {
        action: "studio.template.save",
        entity: "studio_contract_template",
        entityId: t.id,
        summary: `Saved template ${t.name}`,
      },
    };
  });
}

export async function createFromTemplateAction(input: {
  jobId: string;
  templateId: string;
  subject?: string;
  minor?: boolean;
  guardian?: string;
  signerEmail?: string;
}) {
  return studioOwner(async ({ db }) => {
    const j = id.safeParse(input.jobId);
    const t = id.safeParse(input.templateId);
    if (!j.success) throw new StudioError("Pick a job.");
    if (!t.success) throw new StudioError("Pick a template.");
    const { contract, missing } = await forms.createContractFromTemplate(db, {
      jobId: j.data,
      templateId: t.data,
      subject: input.subject,
      minor: input.minor,
      guardianName: input.guardian,
      signerEmail: input.signerEmail,
    });
    return {
      message: missing.length
        ? `Created (draft). Fill in: ${missing.join(", ")}`
        : "Created (draft). Send it from the Contracts page.",
      audit: {
        action: "studio.contract.create",
        entity: "studio_contract",
        entityId: contract.id,
        summary: `Created ${contract.title}`,
      },
    };
  });
}

export async function savePoliciesAction(input: {
  businessName: string;
  galleryMonths: string;
  extensionMonths: string;
  extensionFee: string;
  cancellationDays: string;
}) {
  return studioOwner(async ({ db }) => {
    const fee = Number(input.extensionFee.replace(/[$,\s]/g, ""));
    if (!Number.isFinite(fee) || fee < 0) throw new StudioError("Enter the extension fee as a number of dollars.");
    await forms.savePolicies(db, {
      businessName: input.businessName.trim() || "Jerry Qiu Photography",
      galleryAccessMonths: Number(input.galleryMonths),
      extensionMonths: Number(input.extensionMonths),
      extensionFeeCents: Math.round(fee * 100),
      extensionFeeIsSample: false,
      cancellationDays: Number(input.cancellationDays),
    });
    return {
      message: "Policies saved",
      audit: {
        action: "studio.policies.save",
        entity: "studio_setting",
        entityId: "policies",
        summary: "Updated gallery and cancellation policies",
      },
    };
  });
}

export async function saveQuestionnaireAction(input: {
  id?: string;
  name: string;
  description?: string;
  fields: string;
}) {
  return studioOwner(async ({ db }) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input.fields);
    } catch {
      // One question per line: "label | type | option, option" (type: text, longtext, choice, yesno, date; "*" after the label = required)
      parsed = input.fields
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l, i) => {
          const [labelRaw, typeRaw = "text", opts = ""] = l.split("|").map((x) => x.trim());
          const required = labelRaw.endsWith("*");
          return {
            id: `q${i + 1}`,
            label: labelRaw.replace(/\*$/, "").trim(),
            type: typeRaw.toLowerCase(),
            required,
            options: opts ? opts.split(",").map((o) => o.trim()) : undefined,
          };
        });
    }
    const q = await forms.saveQuestionnaire(db, {
      id: input.id && id.safeParse(input.id).success ? input.id : undefined,
      name: input.name,
      description: input.description,
      fields: parsed,
    });
    return {
      message: "Questionnaire saved",
      audit: {
        action: "studio.questionnaire.save",
        entity: "studio_questionnaire",
        entityId: q.id,
        summary: `Saved questionnaire ${q.name}`,
      },
    };
  });
}

export async function sendQuestionnaireAction(input: { questionnaireId: string; clientId: string; jobId?: string }) {
  return studioOwner(async ({ db }) => {
    const q = id.safeParse(input.questionnaireId);
    const c = id.safeParse(input.clientId);
    if (!q.success || !c.success) throw new StudioError("Pick a questionnaire and a client.");
    const { send, token, client } = await forms.sendQuestionnaire(db, {
      questionnaireId: q.data,
      clientId: c.data,
      jobId: input.jobId && id.safeParse(input.jobId).success ? input.jobId : null,
    });
    const link = `${getSite("photos").url}/client/questionnaire/${token}`;
    await sendTemplate(
      db,
      client.email,
      "questionnaire-sent",
      { name: client.name, title: send.title, link, linkLabel: "Answer the questions" },
      { related: { type: "questionnaire", id: send.id } },
    );
    return {
      message: "Sent (the email is in the Inbox)",
      extra: { link },
      audit: {
        action: "studio.questionnaire.send",
        entity: "studio_questionnaire_send",
        entityId: send.id,
        summary: `Sent ${send.title}`,
      },
    };
  });
}
