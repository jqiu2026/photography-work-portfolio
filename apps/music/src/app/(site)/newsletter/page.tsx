import type { Metadata } from "next";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Newsletter" };

export default function Newsletter() {
  return (
    <main id="main">
      <PageHeader
        eyebrow="Music"
        title="Newsletter"
        intro="A short note when new music is published. No more than once a month. You confirm by link first."
      />
      <div className="mu-wrap mu-section">
        <NewsletterForm />
      </div>
    </main>
  );
}
