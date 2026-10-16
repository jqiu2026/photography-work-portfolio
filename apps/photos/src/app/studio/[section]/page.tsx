import { Container, Heading, Section, Text } from "@halation/ui";
import { getDb, schema } from "@jerryqiu/db";
import * as st from "@jerryqiu/db/studio";
import { desc, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/auth";
import { Shell } from "@/components/Shell";
import { StudioApp, type StudioData } from "@/components/studio/StudioApp";
import { studioSections } from "@/components/studio/sections";

export const dynamic = "force-dynamic";
export const metadata = { title: "Studio", robots: { index: false, follow: false } };

/** Studio (Phase 3): clients, jobs, client galleries, contracts, invoices, bookings. Owner only; data lives in the database. */
export default async function StudioSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!studioSections.some((s) => s.id === section)) notFound();
  const user = await requirePageUser("studio.access", `/studio/${section}`);
  const db = getDb();
  if (!db)
    return (
      <Shell>
        <Container size="md" style={{ paddingBlock: "8rem" }}>
          <Heading as="h1" size="3xl" display>
            Studio
          </Heading>
          <Text tone="muted" style={{ marginTop: "1rem" }}>
            The database isn't set up (DATABASE_URL is missing), so the studio has nothing to show. See
            docs/owner-guide.md.
          </Text>
        </Container>
      </Shell>
    );
  const [clients, jobs, galleries, bookings, contracts, invoices, media, emails] = await Promise.all([
    st.listClients(db),
    st.listJobs(db),
    st.listGalleries(db),
    st.listBookings(db),
    st.listContracts(db),
    st.listInvoices(db),
    db
      .select({ id: schema.media.id, filename: schema.media.filename })
      .from(schema.media)
      .where(isNull(schema.media.deletedAt))
      .orderBy(desc(schema.media.createdAt))
      .limit(80),
    db.select().from(schema.emailLog).orderBy(desc(schema.emailLog.createdAt)).limit(60),
  ]);
  const counts = new Map<string, number>();
  for (const g of galleries) counts.set(g.gallery.id, (await st.galleryItems(db, g.gallery.id)).length);
  const data: StudioData = {
    clients: clients.map((c) => ({ id: c.id, name: c.name, email: c.email })),
    jobs: jobs.map((r) => ({
      id: r.job.id,
      clientId: r.client.id,
      clientName: r.client.name,
      title: r.job.title,
      date: r.job.date,
      status: r.job.status,
      feeCents: r.job.feeCents,
    })),
    galleries: galleries.map((r) => ({
      id: r.gallery.id,
      jobTitle: r.job.title,
      title: r.gallery.title,
      status: r.gallery.status,
      items: counts.get(r.gallery.id) ?? 0,
    })),
    bookings: bookings.map((b) => ({
      id: b.id,
      name: b.name,
      email: b.email,
      topic: b.topic,
      message: b.message,
      status: b.status,
      phone: b.phone,
      shootType: b.shootType,
      eventDate: b.eventDate,
      location: b.location,
      budget: b.budget,
      guests: b.guests,
      source: b.source,
      score: b.score,
      details: b.details ?? {},
      createdAt: b.createdAt.toISOString(),
    })),
    emails: emails.map((m) => ({
      id: m.id,
      kind: m.kind,
      to: m.toEmail,
      subject: m.subject,
      text: m.bodyText,
      status: m.status,
      provider: m.provider,
      error: m.error,
      at: m.createdAt.toISOString(),
    })),
    contracts: contracts.map((r) => ({
      id: r.contract.id,
      jobTitle: r.job.title,
      status: r.contract.status,
      signedBy: r.contract.signerName,
    })),
    invoices: invoices.map((r) => ({
      id: r.invoice.id,
      number: r.invoice.number,
      jobTitle: r.job.title,
      status: r.invoice.status,
      totalCents: r.invoice.totalCents,
      lines: r.invoice.lines.map((l) => l.description).join(" + "),
    })),
    media: media.map((m) => ({ id: m.id, filename: m.filename })),
  };
  void eq;
  return (
    <Shell>
      <StudioApp section={section} user={user.name ?? user.email ?? "owner"} data={data} />
    </Shell>
  );
}
