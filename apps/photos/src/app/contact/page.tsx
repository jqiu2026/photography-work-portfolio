import { ContactForm } from "@jerryqiu/sites/contact";
import { person } from "@jerryqiu/sites/profile";
import type { Metadata } from "next";
import { Page } from "@/components/Marketing";

export const metadata: Metadata = { title: "Contact", description: "Write to me." };

export default function Contact() {
  return (
    <Page title="Contact" lede="A question about a photograph, a license, a booking? Write.">
      <ContactForm
        to={person.bookingEmail}
        endpoint="/api/contact"
        topics={["General", "Licensing a photograph", "Booking", "Something else"]}
        privacyHref="/privacy"
      />
    </Page>
  );
}
