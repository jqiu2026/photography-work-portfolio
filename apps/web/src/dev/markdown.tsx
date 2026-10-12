import type { ReactNode } from "react";

/** Tiny markdown renderer for PROGRESS.md (headings, lists, checkboxes, bold, code, links). Dev tooling only. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={key++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={key++}>{t.slice(1, -1)}</code>);
    else {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(t) ?? [];
      out.push(
        <a key={key++} href={href}>
          {label}
        </a>,
      );
    }
    last = i + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  let list: ReactNode[] = [];
  const flush = () => {
    if (list.length) blocks.push(<ul key={`ul${blocks.length}`}>{list}</ul>);
    list = [];
  };
  source.split("\n").forEach((line, idx) => {
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    const li = /^\s*[-*]\s+(\[( |x)\]\s+)?(.*)$/.exec(line);
    if (h) {
      flush();
      const Tag = `h${h[1].length}` as "h1" | "h2" | "h3" | "h4";
      blocks.push(<Tag key={idx}>{inline(h[2])}</Tag>);
    } else if (li) {
      const done = li[2] === "x";
      list.push(
        <li key={idx} data-check={li[1] ? (done ? "done" : "todo") : undefined}>
          {li[1] ? <span aria-hidden>{done ? "✓ " : "○ "}</span> : null}
          {inline(li[3])}
        </li>,
      );
    } else if (line.trim()) {
      flush();
      blocks.push(<p key={idx}>{inline(line)}</p>);
    } else flush();
  });
  flush();
  return <>{blocks}</>;
}
