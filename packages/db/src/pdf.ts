/**
 * A tiny, dependency-free PDF writer for invoices, receipts and signed-contract audit pages: Helvetica text on A4 pages.
 * Text is WinAnsi (Latin-1); anything else becomes "?". Not a layout engine: titled lines and wrapped paragraphs only.
 */
const esc = (s: string) =>
  s
    .replace(/[^\x20-\x7e\xa0-\xff]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

export function wrapText(text: string, max = 92): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    if (!para.trim()) {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of para.split(/\s+/)) {
      if (!line) line = word;
      else if (line.length + 1 + word.length <= max) line += ` ${word}`;
      else {
        out.push(line);
        line = word;
      }
      while (line.length > max) {
        out.push(line.slice(0, max));
        line = line.slice(max);
      }
    }
    out.push(line);
  }
  return out;
}

export type PdfLine = { text: string; size?: number; bold?: boolean; gapBefore?: number };

export function renderPdf(title: string, lines: PdfLine[]): Uint8Array {
  const W = 595;
  const H = 842;
  const margin = 56;
  const pages: string[][] = [[]];
  let y = H - margin;
  for (const l of lines) {
    const size = l.size ?? 11;
    const lead = size * 1.45 + (l.gapBefore ?? 0);
    if (y - lead < margin) {
      pages.push([]);
      y = H - margin;
    }
    y -= lead;
    if (l.text)
      pages[pages.length - 1].push(
        `BT /${l.bold ? "F2" : "F1"} ${size} Tf ${margin} ${y.toFixed(1)} Td (${esc(l.text)}) Tj ET`,
      );
  }
  const objs: string[] = [];
  const add = (body: string) => objs.push(body) && objs.length;
  const catalog = add("<< /Type /Catalog /Pages 2 0 R >>");
  void catalog;
  add(""); // pages, filled below
  const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const info = add(`<< /Title (${esc(title)}) /Producer (jerryqiu.com studio) >>`);
  const kids: number[] = [];
  for (const p of pages) {
    const content = p.join("\n");
    const c = add(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
    const page = add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${c} 0 R /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> >>`,
    );
    kids.push(page);
  }
  objs[1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, "latin1"));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(out, "latin1"));
}
