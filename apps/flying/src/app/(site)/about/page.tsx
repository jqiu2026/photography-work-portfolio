import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { getFlyingContent } from "@/lib/interests";

export const metadata: Metadata = { title: "About" };

export default async function About() {
  const flying = await getFlyingContent();
  return (
    <div>
      <PageHeader eyebrow="Flying" title="The short version" />
      <div className="fl-wrap fl-section">
        <div className="hm-prose">
          <p style={{ fontSize: "var(--hm-text-xl)" }}>
            {flying.story ??
              "I'm a certified drone pilot (FAA Part 107) and I run the Instagram account for the StuyAviators club."}
          </p>
          <p className="fl-muted">{flying.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
