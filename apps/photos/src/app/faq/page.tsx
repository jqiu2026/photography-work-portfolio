import type { Metadata } from "next";
import { Page } from "@/components/Marketing";
import { faq } from "@/content/faq";

export const metadata: Metadata = { title: "FAQ", description: "Questions people ask before booking." };

export default function Faq() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.text },
    })),
  };
  return (
    <Page title="FAQ" lede="Short answers.">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      {faq.map((f) => (
        <section key={f.q}>
          <h2>{f.q}</h2>
          <p>{f.a}</p>
        </section>
      ))}
    </Page>
  );
}
