import { Container, Eyebrow, Grid, Heading, Section, SocialLinks, Text } from "@placeholder/ui";
import type { Metadata } from "next";
import { ContactForm } from "@/components/site/ContactForm";
import { PageHeader } from "@/components/site/PageHeader";
import { SiteShell } from "@/components/site/SiteShell";
import { person, socials } from "@/content/site";

export const metadata: Metadata = {
  title: "Connect",
  description: "Where to find me online, and how to get in touch.",
};

export default function Connect() {
  return (
    <SiteShell transparentTop={false}>
      <PageHeader
        eyebrow="Connect"
        title="Let's talk"
        intro="The easiest way is email. I'm also on the accounts below."
      />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <Grid cols={2} gap={12}>
            <div>
              <Eyebrow style={{ marginBottom: "1rem" }}>Online</Eyebrow>
              <SocialLinks links={socials} />
              <Heading as="h2" size="xl" style={{ margin: "3rem 0 0.75rem" }}>
                Email
              </Heading>
              <Text>
                <a href={`mailto:${person.email}`} style={{ textDecoration: "underline" }}>
                  {person.email}
                </a>
              </Text>
              <Heading as="h2" size="xl" style={{ margin: "2rem 0 0.75rem" }}>
                Bookings
              </Heading>
              <Text>
                <a href={`mailto:${person.bookingEmail}`} style={{ textDecoration: "underline" }}>
                  {person.bookingEmail}
                </a>
              </Text>
            </div>
            <div>
              <Eyebrow style={{ marginBottom: "1rem" }}>Send a message</Eyebrow>
              <ContactForm to={person.email} />
            </div>
          </Grid>
        </Container>
      </Section>
    </SiteShell>
  );
}
