import { Container, Heading, Section, Text } from "@halation/ui";
import { getDb, schema } from "@jerryqiu/db";
import * as st from "@jerryqiu/db/studio";
import { desc, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/auth";
import { Shell } from "@/components/Shell";
import { CalendarView } from "@/components/studio/CalendarView";
import { PipelineView } from "@/components/studio/PipelineView";
import { StudioApp, type StudioData } from "@/components/studio/StudioApp";
import { CatalogView } from "@/components/studio/CatalogView";
import { QuotesView } from "@/components/studio/QuotesView";
import { FormsView } from "@/components/studio/FormsView";
import { calendarData } from "@/lib/studio-calendar";
import * as forms from "@jerryqiu/db/forms";
import { formatMoney } from "@jerryqiu/db/pricing";
import * as com from "@jerryqiu/db/commerce";
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
  if (section === "calendar")
    return (
      <Shell>
        <CalendarView user={user.name ?? user.email ?? "owner"} data={await calendarData(db)} />
      </Shell>
    );
  if (section === "packages") {
    await com.seedSampleCatalog(db);
    const [packages, addOns, promos, clients, settings] = await Promise.all([
      com.listPackages(db),
      com.listAddOns(db),
      com.listPromos(db),
      st.listClients(db),
      com.getPaymentsSettings(db),
    ]);
    return (
      <Shell>
        <CatalogView
          user={user.name ?? user.email ?? "owner"}
          data={{
            packages: packages.map((p) => ({
              id: p.id,
              name: p.name,
              tagline: p.tagline,
              tier: p.tier,
              priceCents: p.priceCents,
              deliverables: p.deliverables,
              mandatoryFees: p.mandatoryFees,
              includedAddOns: p.includedAddOns,
              featured: p.featured,
              visible: p.visible,
              isSample: p.isSample,
            })),
            addOns: addOns.map((a) => ({
              id: a.id,
              slug: a.slug,
              name: a.name,
              description: a.description,
              priceCents: a.priceCents,
              unit: a.unit,
              maxQty: a.maxQty,
              isFee: a.isFee,
              upsell: a.upsell,
              isSample: a.isSample,
            })),
            promos: promos.map((p) => ({
              id: p.id,
              code: p.code,
              kind: p.kind,
              off: p.percentOff ? `${p.percentOff}% off` : `${((p.amountOffCents ?? 0) / 100).toFixed(2)} off`,
              uses: p.uses,
              maxUses: p.maxUses,
              active: p.active,
              note: p.note,
            })),
            clients: clients.map((c) => ({ id: c.id, name: c.name })),
            settings: {
              depositPercent: settings.depositPercent,
              quoteValidDays: settings.quoteValidDays,
              taxRate: (settings.taxRateBp / 100).toString(),
              taxLabel: settings.taxLabel,
              taxIsSample: settings.taxIsSample,
            },
          }}
        />
      </Shell>
    );
  }
  if (section === "forms") {
    await forms.seedSampleTemplates(db);
    await forms.seedSampleQuestionnaires(db);
    const [templates, questionnaires, sends, jobs, clients, policies] = await Promise.all([
      forms.listTemplates(db),
      forms.listQuestionnaires(db),
      forms.listSends(db),
      st.listJobs(db),
      st.listClients(db),
      forms.getPolicies(db),
    ]);
    return (
      <Shell>
        <FormsView
          user={user.name ?? user.email ?? "owner"}
          data={{
            templates: templates.map((t) => ({
              id: t.id,
              name: t.name,
              kind: t.kind,
              body: t.body,
              isSample: t.isSample,
              termMonths: t.usageRights?.termMonths ?? null,
              personal: t.usageRights?.personal ?? true,
              commercial: t.usageRights?.commercial ?? false,
            })),
            questionnaires: questionnaires.map((q) => ({
              id: q.id,
              name: q.name,
              description: q.description,
              isSample: q.isSample,
              fields: q.fields,
            })),
            sends: sends.map((r) => ({
              id: r.send.id,
              title: r.send.title,
              client: r.client.name,
              sentAt: r.send.sentAt.toISOString(),
              completed: Boolean(r.send.completedAt),
              answers: r.send.fields.flatMap((fl) =>
                r.send.answers?.[fl.id] ? [{ label: fl.label, value: r.send.answers[fl.id] }] : [],
              ),
            })),
            jobs: jobs.map((r) => ({ id: r.job.id, title: r.job.title })),
            clients: clients.map((c) => ({ id: c.id, name: c.name })),
            policies: {
              businessName: policies.businessName,
              galleryAccessMonths: policies.galleryAccessMonths,
              extensionMonths: policies.extensionMonths,
              extensionFee: (policies.extensionFeeCents / 100).toFixed(2),
              cancellationDays: policies.cancellationDays,
              sample: policies.extensionFeeIsSample,
            },
          }}
        />
      </Shell>
    );
  }
  void formatMoney;
  if (section === "quotes") {
    await com.seedSampleCatalog(db);
    const [quotes, clients, packages, addOns] = await Promise.all([
      com.listQuotes(db),
      st.listClients(db),
      com.listPackages(db),
      com.listAddOns(db),
    ]);
    return (
      <Shell>
        <QuotesView
          user={user.name ?? user.email ?? "owner"}
          data={{
            quotes: quotes.map((r) => ({
              id: r.quote.id,
              number: r.quote.number,
              title: r.quote.title,
              client: r.client.name,
              status: r.quote.status,
              totalCents: r.quote.totalCents,
              isSample: r.quote.isSample,
              validUntil: r.quote.validUntil?.toISOString().slice(0, 10) ?? null,
            })),
            clients: clients.map((c) => ({ id: c.id, name: c.name })),
            packages: packages.map((p) => ({ id: p.id, name: p.name, priceCents: p.priceCents })),
            addOns: addOns.map((a) => ({ id: a.id, name: a.name, priceCents: a.priceCents, unit: a.unit })),
          }}
        />
      </Shell>
    );
  }
  if (section === "pipeline") {
    const [leads, jobs] = await Promise.all([st.listBookings(db), st.listJobs(db)]);
    return (
      <Shell>
        <PipelineView
          user={user.name ?? user.email ?? "owner"}
          data={{
            leads: leads
              .filter((b) => b.status === "new")
              .sort((a, b) => b.score - a.score)
              .map((b) => ({ id: b.id, name: b.name, shootType: b.shootType, score: b.score, eventDate: b.eventDate })),
            jobs: jobs
              .filter((r) => r.job.status !== "cancelled")
              .map((r) => ({
                id: r.job.id,
                title: r.job.title,
                client: r.client.name,
                status: r.job.status,
                date: r.job.date,
                feeCents: r.job.feeCents,
              })),
          }}
        />
      </Shell>
    );
  }
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
      title: r.contract.title,
      kind: r.contract.kind,
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
