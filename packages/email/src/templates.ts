/**
 * Branded transactional email templates. Every value is HTML-escaped; subjects and headers are stripped of CR/LF.
 * No photographs are ever embedded (image protection applies to email too): emails link to the gallery instead.
 * Wording is plain and draft; `TODO(owner)` copy is rewritten in the owner's voice before launch.
 */
export type TemplateKind =
  | "inquiry-received"
  | "inquiry-owner"
  | "booking-confirmed"
  | "quote-sent"
  | "contract-sent"
  | "invoice-sent"
  | "payment-receipt"
  | "gallery-ready"
  | "gallery-expiring"
  | "questionnaire-sent"
  | "magic-link"
  | "reminder"
  | "reply";

export type TemplateData = {
  name?: string;
  title?: string;
  summary?: string;
  link?: string;
  linkLabel?: string;
  amount?: string;
  date?: string;
  detail?: string;
  businessName?: string;
};

export type Rendered = { subject: string; text: string; html: string };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
export const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();
const safeLink = (u?: string) => (u && /^https?:\/\//i.test(u) ? u : undefined);

type Spec = (d: TemplateData) => { subject: string; heading: string; lines: string[]; cta?: string };

const specs: Record<TemplateKind, Spec> = {
  "inquiry-received": (d) => ({
    subject: "I got your message",
    heading: "Thanks, I got your message",
    lines: [
      `Hi ${d.name || "there"},`,
      "Thanks for getting in touch. I read every message myself and will reply by email, usually within two days.",
      d.summary ? `What I have: ${d.summary}` : "",
    ],
  }),
  "inquiry-owner": (d) => ({
    subject: `New inquiry: ${d.title || "photography"}`,
    heading: "New inquiry",
    lines: [`${d.name || "Someone"} sent an inquiry.`, d.summary ?? "", d.detail ?? ""],
    cta: "Open in the studio",
  }),
  "booking-confirmed": (d) => ({
    subject: `Booked: ${d.title || "your shoot"}`,
    heading: "You're booked",
    lines: [`Hi ${d.name || "there"},`, `Your shoot${d.date ? ` on ${d.date}` : ""} is confirmed.`, d.detail ?? ""],
    cta: "View your booking",
  }),
  "quote-sent": (d) => ({
    subject: `Your quote: ${d.title || "photography"}`,
    heading: "Your quote is ready",
    lines: [
      `Hi ${d.name || "there"},`,
      "I've put together a quote for you. You can review it and accept it online.",
      d.amount ? `Total: ${d.amount}` : "",
    ],
    cta: "Review the quote",
  }),
  "contract-sent": (d) => ({
    subject: `Please sign: ${d.title || "agreement"}`,
    heading: "Your agreement is ready to sign",
    lines: [
      `Hi ${d.name || "there"},`,
      "Please read and sign the agreement. Typing your name signs it; the link works once.",
    ],
    cta: "Read and sign",
  }),
  "invoice-sent": (d) => ({
    subject: `Invoice ${d.title || ""}`.trim(),
    heading: "Your invoice",
    lines: [
      `Hi ${d.name || "there"},`,
      d.amount ? `Amount due: ${d.amount}${d.date ? `, due ${d.date}` : ""}.` : "",
      "You can pay securely online.",
    ],
    cta: "Pay the invoice",
  }),
  "payment-receipt": (d) => ({
    subject: `Receipt ${d.title || ""}`.trim(),
    heading: "Payment received",
    lines: [`Hi ${d.name || "there"},`, `Thank you. We received ${d.amount ?? "your payment"}.`, d.detail ?? ""],
  }),
  "gallery-ready": (d) => ({
    subject: `Your gallery is ready: ${d.title || ""}`.trim(),
    heading: "Your photographs are ready",
    lines: [
      `Hi ${d.name || "there"},`,
      "Your gallery is ready to view. You'll need the passcode I sent you, or your portal login.",
    ],
    cta: "Open your gallery",
  }),
  "gallery-expiring": (d) => ({
    subject: `Your gallery expires${d.date ? ` on ${d.date}` : " soon"}`,
    heading: "Your gallery is about to expire",
    lines: [
      `Hi ${d.name || "there"},`,
      `Your gallery${d.title ? ` "${d.title}"` : ""} expires${d.date ? ` on ${d.date}` : " soon"}. You can extend it from the gallery page.`,
    ],
    cta: "Extend or download",
  }),
  "questionnaire-sent": (d) => ({
    subject: "A few questions before your shoot",
    heading: "Before your shoot",
    lines: [`Hi ${d.name || "there"},`, "A few questions help me prepare. It takes about five minutes."],
    cta: "Answer the questions",
  }),
  "magic-link": (d) => ({
    subject: "Your sign-in link",
    heading: "Sign in",
    lines: [
      `Hi ${d.name || "there"},`,
      "Use this link to sign in. It works once and expires soon. If you didn't ask for it, ignore this email.",
    ],
    cta: "Sign in",
  }),
  reminder: (d) => ({
    subject: d.title || "A reminder",
    heading: d.title || "A reminder",
    lines: [`Hi ${d.name || "there"},`, d.summary ?? "", d.detail ?? ""],
    cta: d.linkLabel,
  }),
  reply: (d) => ({
    subject: d.title || "Re: your message",
    heading: d.title || "Reply",
    lines: [d.summary ?? ""],
  }),
};

export function renderEmail(kind: TemplateKind, data: TemplateData = {}): Rendered {
  const spec = specs[kind](data);
  const business = data.businessName || "Jerry Qiu Photography";
  const link = safeLink(data.link);
  const cta = spec.cta || data.linkLabel || "Open";
  const lines = spec.lines.filter(Boolean);
  const text = [
    ...lines,
    link ? `${cta}: ${link}` : "",
    "",
    `${business}`,
    "You are receiving this because you contacted or booked with me. Reply to this email to reach me.",
  ]
    .filter((l, i, a) => l || a[i - 1])
    .join("\n\n");
  const html = `<!doctype html><html><body style="margin:0;background:#0b0b0d;font-family:Helvetica,Arial,sans-serif;color:#e9e9ee">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#15151a;border-radius:12px;border:1px solid #26262e">
<tr><td style="padding:28px 32px 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#ff5a4d">${esc(business)}</td></tr>
<tr><td style="padding:0 32px 8px;font-size:24px;line-height:1.25;color:#fff">${esc(spec.heading)}</td></tr>
<tr><td style="padding:8px 32px 0;font-size:16px;line-height:1.55">${lines.map((l) => `<p style="margin:0 0 14px">${esc(l)}</p>`).join("")}</td></tr>
${link ? `<tr><td style="padding:8px 32px 24px"><a href="${esc(link)}" style="display:inline-block;background:#ff5a4d;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${esc(cta)}</a></td></tr>` : ""}
<tr><td style="padding:16px 32px 28px;font-size:12px;color:#8a8a96;border-top:1px solid #26262e">You are receiving this because you contacted or booked with me. Reply to this email to reach me.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: oneLine(spec.subject).slice(0, 200), text, html };
}
