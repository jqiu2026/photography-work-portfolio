import type { Metadata } from "next";
import { Page } from "@/components/Marketing";
import { PrivacyRequestForm } from "@/components/PrivacyRequestForm";

export const metadata: Metadata = {
  title: "Remove a photo of me",
  description: "Ask for a photograph from a private event to be taken down.",
};

export default function PrivacyRequest() {
  return (
    <Page
      title="Remove a photo of me"
      lede="If a photograph from a private event shows you and you would rather it did not, tell me which one."
    >
      <p>
        This is for photographs taken at <strong>private events and in non-public settings</strong>: a party, a private
        school function, someone&rsquo;s home. If it is gone from every gallery and the portfolio, I email you to say
        so. You never have to explain why. A request about a minor can come from them or from a parent or guardian.
      </p>
      <p>
        Photographs taken in a <strong>public setting</strong> (a street, a public performance, a parade, a game open to
        everyone) are not covered, because nobody has a privacy expectation there. I may still take one down if you ask
        kindly, but I am not obliged to.
      </p>
      <PrivacyRequestForm />
    </Page>
  );
}
