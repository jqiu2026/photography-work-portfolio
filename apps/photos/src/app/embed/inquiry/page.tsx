import { person } from "@jerryqiu/sites/profile";
import type { Metadata } from "next";
import { InquiryForm } from "@/components/InquiryForm";
import { shootType } from "@/content/shoot-types";

export const metadata: Metadata = { title: "Inquiry", robots: { index: false, follow: false } };

/** The inquiry form for embedding in an iframe on an allowed site (see `frame-ancestors` in next.config.mjs). */
export default function EmbedInquiry() {
  const t = shootType("other");
  if (!t) return null;
  return (
    <main style={{ padding: "1rem" }}>
      <InquiryForm type={{ ...t, label: "General" }} fallbackEmail={person.bookingEmail} embed />
    </main>
  );
}
