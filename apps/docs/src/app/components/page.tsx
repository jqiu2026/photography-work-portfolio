import type { Metadata } from "next";
import { docs, groups } from "@/content/components";

export const metadata: Metadata = { title: "Components" };

export default function Page() {
  return (
    <article className="docs-prose">
      <h1>Components</h1>
      <p>{docs.length} of the components, each with a live example where one makes sense, its props, accessibility notes and when not to use it.</p>
      {groups.map((g) => (
        <section key={g}>
          <h2 id={g.toLowerCase().replace(/\W+/g, "-")}>{g}</h2>
          <ul>
            {docs
              .filter((d) => d.group === g)
              .map((d) => (
                <li key={d.name}>
                  <a href={`/components/${d.name.toLowerCase()}`}>{d.name}</a>: {d.summary}
                </li>
              ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
