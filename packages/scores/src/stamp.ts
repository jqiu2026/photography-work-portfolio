import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { type LicenseFacts, licenseLines } from "./license";

/**
 * Per-buyer copy of a score PDF: a small footer with the holder and license number on every page, a faint diagonal mark,
 * and a license page at the end. The original file is never changed; the stamped bytes are made per download.
 */
export async function stampScore(original: Uint8Array, facts: LicenseFacts): Promise<Uint8Array> {
  const doc = await PDFDocument.load(original, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const foot = `Licensed to ${facts.holder} · ${facts.licenseNo} · not for redistribution`.replace(
    /[^\x20-\x7e]/g,
    "-",
  );
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    page.drawText(foot, { x: 28, y: 14, size: 7, font, color: rgb(0.35, 0.35, 0.35) });
    const mark = facts.licenseNo;
    const size = Math.min(width, height) / 12;
    page.drawText(mark, {
      x: width * 0.18,
      y: height * 0.3,
      size,
      font: bold,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.1,
      rotate: degrees(40),
    });
  }
  appendLicensePage(doc, font, bold, facts);
  doc.setSubject(`License ${facts.licenseNo}`);
  doc.setKeywords([facts.licenseNo]);
  return doc.save();
}

function appendLicensePage(
  doc: PDFDocument,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  bold: typeof font,
  facts: LicenseFacts,
) {
  const page = doc.addPage([595, 842]);
  let y = 780;
  const lines = licenseLines(facts);
  page.drawText("Score license", { x: 56, y, size: 20, font: bold });
  y -= 34;
  for (const [i, raw] of lines.entries()) {
    const text = raw.replace(/[^\x20-\x7e]/g, "-");
    if (!text) {
      y -= 10;
      continue;
    }
    for (const part of wrap(text, 92)) {
      page.drawText(part, { x: 56, y, size: i < 2 ? 12 : 10.5, font: i < 2 ? bold : font });
      y -= 16;
    }
  }
}

function wrap(text: string, max: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(/\s+/)) {
    if (line && line.length + 1 + w.length > max) {
      out.push(line);
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line) out.push(line);
  return out;
}

/** A standalone license PDF (for scores that are not PDFs, and as a receipt attachment). */
export async function licensePdf(facts: LicenseFacts): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  appendLicensePage(doc, font, bold, facts);
  return doc.save();
}
