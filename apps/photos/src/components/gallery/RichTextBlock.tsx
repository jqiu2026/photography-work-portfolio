import type { ReactNode } from "react";

/** Plain text with **bold**, *italic*, [links](https://…) and "- " lists, rendered as safe elements (no HTML is ever injected). */
export function RichTextBlock({ text }: { text: string }) {
  const inline = (line: string) => {
    const out: ReactNode[] = [];
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((?:https?:\/\/|mailto:)[^)\s]+\))/g;
    let last = 0;
    let k = 0;
    for (const m of line.matchAll(re)) {
      if (m.index > last) out.push(line.slice(last, m.index));
      const t = m[0];
      if (t.startsWith("**")) out.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
      else if (t.startsWith("*")) out.push(<em key={k++}>{t.slice(1, -1)}</em>);
      else {
        const [, label, href] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t) ?? [];
        out.push(
          <a key={k++} href={href} target="_blank" rel="noreferrer">
            {label}
          </a>,
        );
      }
      last = m.index + t.length;
    }
    if (last < line.length) out.push(line.slice(last));
    return out;
  };
  return (
    <div className="gx-rich">
      {text.split(/\n{2,}/).map((block, i) => {
        const lines = block.split("\n").filter(Boolean);
        if (lines.length && lines.every((l) => l.startsWith("- ")))
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          );
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}
