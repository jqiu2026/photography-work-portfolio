import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Page } from "@/components/Marketing";

export const metadata: Metadata = {
  title: "How it works",
  description: "From first message to delivered photographs.",
};

const steps: [string, string, "live" | "preview" | "soon"][] = [
  [
    "You ask",
    "Pick the kind of shoot and tell me about it, or pick a free time straight away. Your message is stored and you get a confirmation email.",
    "live",
  ],
  [
    "I reply with a quote",
    "A package with what you receive (coverage time, edited images, how long your gallery stays online), the extras priced on their own, and tax as its own line. You accept it online by typing your name.",
    "live",
  ],
  [
    "Paperwork, once",
    "A contract (and a release if people in the photographs need one) you sign by typing your name, and a short questionnaire so I can prepare.",
    "live",
  ],
  [
    "The deposit holds the date",
    "Pay by card or bank transfer, in one go or in instalments. Your time is held while you pay.",
    "live",
  ],
  ["The shoot", "I send reminders and you can move or cancel inside the policy window from your portal.", "preview"],
  [
    "Your gallery",
    "Private, protected previews you can favorite, rate, approve and comment on. Send me your selection when you are ready.",
    "live",
  ],
  [
    "Delivery",
    "Web-size or full-resolution downloads, single or as ZIP parts, with a PIN if I set one. The portal shows where your photographs are and when to expect them.",
    "live",
  ],
  [
    "After",
    "Galleries stay online for the period in your contract, then can be extended or reactivated. Prints and albums are coming.",
    "preview",
  ],
];

export default function HowItWorks() {
  return (
    <Page
      title="How it works"
      lede="Inquiry to delivery, one step at a time. The same steps run inside the studio and your client portal."
    >
      <ol className="mk-steps">
        {steps.map(([t, d, s]) => (
          <li key={t}>
            <strong>{t}</strong> <Badge status={s} />
            <p>{d}</p>
          </li>
        ))}
      </ol>
      <p>
        See <Link href="/features">every feature and its status</Link>, the <Link href="/packages">packages</Link>, or{" "}
        <Link href="/book">ask about a shoot</Link>.
      </p>
    </Page>
  );
}
