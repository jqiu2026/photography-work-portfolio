import type { Metadata } from "next";
import { ContactForm } from "@/components/site/ContactForm";
import { PageHeader } from "@/components/site/PageHeader";
import { getPerson } from "@/lib/profile";

export const metadata: Metadata = {
  title: "Connect",
  description: "Where to find me online, and how to get in touch.",
};

export default async function Connect() {
  const { person, socials } = await getPerson();
  return (
    <div>
      <PageHeader
        eyebrow="Connect"
        title="Let's talk"
        intro="The easiest way is email. I'm also on the accounts below."
      />
      <div className="hb-wrap hb-section hb-two">
        <div className="hb-stack">
          <h2 className="hb-h2" style={{ margin: 0 }}>
            Online
          </h2>
          <ul className="hb-social">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <h2 className="hb-h2" style={{ margin: "1.5rem 0 0" }}>
            Email
          </h2>
          <p style={{ margin: 0 }}>
            <a className="hb-link" href={`mailto:${person.email}`}>
              {person.email}
            </a>
          </p>
          <h2 className="hb-h2" style={{ margin: "1.5rem 0 0" }}>
            Bookings
          </h2>
          <p style={{ margin: 0 }}>
            <a className="hb-link" href={`mailto:${person.bookingEmail}`}>
              {person.bookingEmail}
            </a>
          </p>
        </div>
        <div className="hb-stack">
          <h2 className="hb-h2" style={{ margin: 0 }}>
            Send a message
          </h2>
          <ContactForm to={person.email} endpoint="/api/contact" />
        </div>
      </div>
    </div>
  );
}
