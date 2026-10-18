import { Container, Section, Text } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { person } from "@jerryqiu/sites/profile";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/InquiryForm";
import { Shell } from "@/components/Shell";
import { shootType, shootTypes } from "@/content/shoot-types";
import "../../globals.css";

export function generateStaticParams() {
  return shootTypes.map((t) => ({ type: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const t = shootType((await params).type);
  return t ? { title: `Book: ${t.label}`, description: t.blurb } : {};
}

export default async function BookType({ params }: { params: Promise<{ type: string }> }) {
  const t = shootType((await params).type);
  if (!t) notFound();
  return (
    <Shell cta={false}>
      <PageHeader eyebrow="Book" title={t.headline} intro={t.blurb} />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <InquiryForm type={t} fallbackEmail={person.bookingEmail} />
        </Container>
      </Section>
    </Shell>
  );
}
