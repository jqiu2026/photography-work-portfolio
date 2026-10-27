import type { Metadata } from "next";
import { CommissionForm } from "@/components/CommissionForm";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Commission a piece",
  description: "Ask Jerry Qiu to write or arrange a piece for your ensemble.",
};

export default function Commission() {
  return (
    <div>
      <PageHeader
        eyebrow="Music"
        title="Commission a piece"
        intro="A new piece or an arrangement for your ensemble, school or occasion. Tell me what you are imagining; I reply with questions and what is possible."
      />
      <div className="mu-wrap mu-section">
        <CommissionForm />
      </div>
    </div>
  );
}
