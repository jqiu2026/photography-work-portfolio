import "server-only";
import { getDb } from "@jerryqiu/db";
import { sendEmail } from "@jerryqiu/email";
import { getSite } from "@jerryqiu/sites";

/**
 * The music site's emails. Plain, short, with the one thing to do. Sent through @jerryqiu/email (Resend when RESEND_API_KEY
 * and EMAIL_FROM are set, the labeled MOCK outbox in development, recorded as skipped in a production build without keys).
 */
const from = () =>
  process.env.MUSIC_EMAIL_FROM?.trim() || process.env.EMAIL_FROM?.trim() || "Jerry Qiu Music <music@music.invalid>";
export const siteUrl = () => getSite("music").url;
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

function html(lines: string[], action?: { label: string; url: string }) {
  return `<div style="font-family:system-ui,sans-serif;max-width:34rem;line-height:1.55">${lines
    .map((l) => `<p>${esc(l)}</p>`)
    .join(
      "",
    )}${action ? `<p><a href="${esc(action.url)}" style="display:inline-block;padding:.7rem 1.2rem;background:#111;color:#fff;border-radius:.4rem;text-decoration:none">${esc(action.label)}</a></p><p style="color:#666;font-size:.85rem">${esc(action.url)}</p>` : ""}</div>`;
}

async function send(
  to: string,
  kind: string,
  subject: string,
  lines: string[],
  action?: { label: string; url: string },
  related?: { type: string; id: string },
) {
  const text = [...lines, ...(action ? ["", `${action.label}: ${action.url}`] : [])].join("\n");
  return sendEmail(getDb() ?? null, { to, subject, text, html: html(lines, action), from: from() }, { kind, related });
}

export const sendSignInLink = (to: string, token: string) =>
  send(
    to,
    "music-signin",
    "Your sign-in link for the score library",
    [
      "Use this link to open your score library. It works once and expires in 30 minutes.",
      "If you did not ask for it, ignore this email.",
    ],
    { label: "Open my library", url: `${siteUrl()}/library/verify?token=${encodeURIComponent(token)}` },
  );

export const sendConfirmSubscription = (to: string, token: string) =>
  send(
    to,
    "music-confirm",
    "Confirm your subscription",
    [
      "Please confirm that you want a note when new music is published. If you did not ask for this, ignore this email.",
    ],
    { label: "Confirm", url: `${siteUrl()}/newsletter/confirm?token=${encodeURIComponent(token)}` },
  );

export const sendReceipt = (
  to: string,
  o: { number: string; id: string; token: string; lines: string[]; total: string },
) =>
  send(
    to,
    "music-receipt",
    `Your scores, order ${o.number}`,
    [
      "Thank you. Your scores are ready to download. Every copy is made for you, with your name and license number on it.",
      "",
      ...o.lines,
      "",
      `Total paid: ${o.total}`,
      "Keep this email: the link below opens your order and downloads any time. You can also sign in to your library with this address.",
    ],
    { label: "Download your scores", url: `${siteUrl()}/order/${o.token}` },
    { type: "music-order", id: o.id },
  );

export const sendCommissionOwner = (c: {
  name: string;
  email: string;
  message: string;
  forces?: string | null;
  occasion?: string | null;
  deadline?: string | null;
  budget?: string | null;
  organization?: string | null;
}) =>
  send(
    process.env.CONTACT_TO_EMAIL?.trim() || "hello@jerryqiu.com",
    "music-commission",
    `Commission inquiry from ${c.name}`,
    [
      `From: ${c.name} <${c.email}>${c.organization ? `, ${c.organization}` : ""}`,
      `For: ${c.forces || "not said"}`,
      `Occasion: ${c.occasion || "not said"}`,
      `Deadline: ${c.deadline || "not said"}`,
      `Budget: ${c.budget || "not said"}`,
      "",
      c.message,
    ],
    { label: "Open the studio", url: `${siteUrl()}/studio/commissions` },
  );

export const sendCommissionAck = (to: string, name: string) =>
  send(to, "music-commission-ack", "Thanks for your commission inquiry", [
    `Hello ${name},`,
    "Thank you for writing. I read every inquiry and will reply within a few days with questions or a first idea of what is possible.",
  ]);

export const sendRefundNotice = (to: string, number: string) =>
  send(to, "music-refund", `Order ${number} was refunded`, [
    `Order ${number} was refunded and its licenses ended. The refund appears on your card in a few days.`,
  ]);
