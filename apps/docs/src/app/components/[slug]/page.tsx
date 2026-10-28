import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Demo } from "@/components/Demos";
import { bySlug, docs } from "@/content/components";
import { Code } from "@/lib/Code";

export function generateStaticParams() {
  return docs.map((d) => ({ slug: d.name.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = bySlug((await params).slug);
  return d ? { title: d.name, description: d.summary } : {};
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const d = bySlug((await params).slug);
  if (!d) notFound();
  return (
    <article className="docs-prose">
      <p className="docs-eyebrow">{d.group}</p>
      <h1>{d.name}</h1>
      <p>{d.summary}</p>
      <h2 id="example">Example</h2>
      {d.live ? <Demo name={d.name} /> : <p><em>Shown in context on the sites; no isolated example.</em></p>}
      <Code language="tsx" code={`import { ${d.name} } from "@holominimal/ui";\n\n${d.code}`} />
      <h2 id="props">Props</h2>
      {d.props.length ? (
        <div className="docs-table" role="region" tabIndex={0} aria-label="Props table">
          <table>
            <thead>
              <tr>
                <th scope="col">Prop</th>
                <th scope="col">Type</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {d.props.map(([n, t, note]) => (
                <tr key={n}>
                  <td><code>{n}</code></td>
                  <td><code>{t}</code></td>
                  <td>{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No props beyond the standard element attributes.</p>
      )}
      <h2 id="accessibility">Accessibility</h2>
      <p>{d.a11y}</p>
      <h2 id="when-not">When not to use it</h2>
      <p>{d.whenNot}</p>
    </article>
  );
}
