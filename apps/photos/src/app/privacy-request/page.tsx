import type { Metadata } from "next";
import { Page } from "@/components/Marketing";
import { PrivacyRequestForm } from "@/components/PrivacyRequestForm";

export const metadata: Metadata = {
  title: "Remove a photo of me",
  description: "Ask for a photograph you appear in to be taken down.",
};

export default function PrivacyRequest() {
  return (
    <Page
      title="Remove a photo of me"
      lede="If you are in a photograph here and would rather you were not, tell me which one and I will take it down."
    >
      <p>
        I photograph public events and school events, and people sometimes would rather not appear online. You never
        have to explain why. I hide the photograph from every gallery and from the portfolio, then email you to say it
        is done. A request about a minor can come from them or from a parent or guardian.
      </p>
      <PrivacyRequestForm />
    </Page>
  );
}
