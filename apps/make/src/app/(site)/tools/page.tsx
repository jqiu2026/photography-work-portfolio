import { toolWall } from "@jerryqiu/db/make";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui";
import { getProjects } from "@/lib/data";

export const metadata: Metadata = { title: "Tool wall", description: "The tools used across the projects." };

export default async function Tools() {
  const wall = toolWall(await getProjects());
  return (
    <div>
      <PageHeader
        eyebrow="Make"
        title="Tool wall"
        intro="Every tool used in the projects here, with how many of them use it."
      />
      <div className="mk-wrap mk-section">
        {wall.length ? (
          <ul className="mk-wall">
            {wall.map((t) => (
              <li key={t.tool}>
                {t.tool} <span className="mk-mono">{t.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>The tools will be listed once the projects are published.</EmptyState>
        )}
      </div>
    </div>
  );
}
