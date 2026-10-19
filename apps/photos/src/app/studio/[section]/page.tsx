import { Container, Heading, Section, Text } from "@/components/ui";
import { getDb, schema } from "@jerryqiu/db";
import * as st from "@jerryqiu/db/studio";
import { desc, eq, inArray, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/auth";
import { StudioShell as Shell } from "@/components/studio/StudioShell";
import { CalendarView } from "@/components/studio/CalendarView";
import { PipelineView } from "@/components/studio/PipelineView";
import { StudioApp, type StudioData } from "@/components/studio/StudioApp";
import { CatalogView } from "@/components/studio/CatalogView";
import { QuotesView } from "@/components/studio/QuotesView";
import { FormsView } from "@/components/studio/FormsView";
import { BillingView } from "@/components/studio/BillingView";
import * as bill from "@jerryqiu/db/billing";
import { AutomationsView, NotificationsView, TasksView } from "@/components/studio/OpsViews";
import * as autoDb from "@jerryqiu/db/automation";
import { OrdersView } from "@/components/studio/OrdersView";
import {
  BrandView,
  MusicView,
  PlanView,
  UsersView,
  VisitorsView,
  WatermarksView,
} from "@/components/studio/AdminViews";
import { ReportsView } from "@/components/studio/ReportsView";
import * as brandDb from "@jerryqiu/db/brand";
import * as extras from "@jerryqiu/db/gallery-extras";
import * as planDb from "@jerryqiu/db/plan";
import * as reportsDb from "@jerryqiu/db/reports";
import { mocksEnabled } from "@jerryqiu/mocks";
import * as shopDb from "@jerryqiu/db/gallery-shop";
import { GalleriesView } from "@/components/studio/GalleriesView";
import * as galDb from "@jerryqiu/db/galleries";
import { DashboardView } from "@/components/studio/DashboardView";
import { dashboardData } from "@/lib/studio-dashboard";
import { calendarData } from "@/lib/studio-calendar";
import * as forms from "@jerryqiu/db/forms";
import { formatMoney } from "@jerryqiu/db/pricing";
import * as com from "@jerryqiu/db/commerce";
import { studioSections } from "@/components/studio/sections";

export const dynamic = "force-dynamic";
export const metadata = { title: "Studio", robots: { index: false, follow: false } };

/** Studio (Phase 3): clients, jobs, client galleries, contracts, invoices, bookings. Owner only; data lives in the database. */
export default async function StudioSection({
  params,
  searchParams,
}: { params: Promise<{ section: string }>; searchParams: Promise<{ tab?: string; days?: string }> }) {
  const { section } = await params;
  const q = await searchParams;
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
  if (section === "overview") {
    const first = (user.name ?? user.email ?? "there").split(/[ @]/)[0];
    const hour = Number(
      new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(
        new Date(),
      ),
    );
    const greeting =
      hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    return (
      <Shell>
        <DashboardView greeting={`${greeting}, ${first}`} data={await dashboardData(db)} />
      </Shell>
    );
  }
  if (section === "galleries") {
    const [rows, jobRows] = await Promise.all([st.listGalleries(db), st.listJobs(db)]);
    const stats = await galDb.galleryStats(
      db,
      rows.map((r) => r.gallery.id),
    );
    // cover: the chosen one, else the first photograph in the gallery
    const firsts = new Map<string, string>();
    for (const r of rows)
      if (!r.gallery.coverMediaId) {
        const [first] = await galDb.galleryContents(db, r.gallery.id);
        if (first) firsts.set(r.gallery.id, first.media.id);
      }
    const coverIds = [
      ...new Set(rows.map((r) => r.gallery.coverMediaId ?? firsts.get(r.gallery.id)).filter(Boolean)),
    ] as string[];
    const coverRows = coverIds.length
      ? await db.select().from(schema.media).where(inArray(schema.media.id, coverIds))
      : [];
    const cover = new Map(coverRows.map((m) => [m.id, m]));
    return (
      <Shell>
        <GalleriesView
          galleries={rows.map((r) => {
            const g = r.gallery;
            const m = cover.get(g.coverMediaId ?? firsts.get(g.id) ?? "");
            const sx = stats.get(g.id);
            return {
              id: g.id,
              title: g.title,
              jobTitle: r.job.title,
              state: galDb.galleryState(g),
              expiresAt: g.expiresAt?.toISOString().slice(0, 10) ?? null,
              publishAt: g.publishAt?.toISOString() ?? null,
              createdAt: g.createdAt.toISOString(),
              photos: sx?.photos ?? 0,
              favorites: sx?.favorites ?? 0,
              downloads: sx?.downloads ?? 0,
              views: sx?.views ?? 0,
              cover: m
                ? { id: m.id, width: m.width ?? 1200, height: m.height ?? 800, color: m.color, blur: m.blur }
                : null,
            };
          })}
          jobs={jobRows.map((r) => ({ id: r.job.id, title: r.job.title, client: r.client.name }))}
        />
      </Shell>
    );
  }
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
  if (section === "tasks") {
    const today = new Date().toISOString().slice(0, 10);
    const tasks = await autoDb.listTasks(db);
    return (
      <Shell>
        <TasksView
          user={user.name ?? user.email ?? "owner"}
          data={{
            tasks: tasks.map((t) => ({
              id: t.id,
              title: t.title,
              dueOn: t.dueOn,
              notes: t.notes,
              done: Boolean(t.doneAt),
              overdue: !t.doneAt && Boolean(t.dueOn) && (t.dueOn as string) < today,
            })),
          }}
        />
      </Shell>
    );
  }
  if (section === "automations") {
    const [rules, runs] = await Promise.all([autoDb.ruleConfig(db), autoDb.recentRuns(db, 40)]);
    return (
      <Shell>
        <AutomationsView
          user={user.name ?? user.email ?? "owner"}
          data={{
            rules,
            runs: runs.map((r) => ({
              id: r.id,
              rule: r.rule,
              entity: `${r.entityType ?? ""} ${r.entityId?.slice(0, 8) ?? ""}`.trim(),
              at: r.at.toISOString().slice(0, 16).replace("T", " "),
              status: r.status,
            })),
          }}
        />
      </Shell>
    );
  }
  if (section === "activity") {
    const items = await autoDb.listNotifications(db);
    return (
      <Shell>
        <NotificationsView
          user={user.name ?? user.email ?? "owner"}
          data={{
            items: items.map((n) => ({
              id: n.id,
              kind: n.kind,
              title: n.title,
              body: n.body,
              link: n.link,
              read: Boolean(n.readAt),
              at: n.createdAt.toISOString().slice(0, 16).replace("T", " "),
            })),
          }}
        />
      </Shell>
    );
  }
  if (section === "billing") {
    const [payments, plans, recurring, jobs, settings, invoiceRows] = await Promise.all([
      bill.listPayments(db),
      bill.listPlans(db),
      bill.listRecurring(db),
      st.listJobs(db),
      bill.getBillingSettings(db),
      st.listInvoices(db),
    ]);
    const paidByPlan = new Map<string, number>();
    for (const r of invoiceRows)
      if (r.invoice.planId && r.invoice.status === "paid")
        paidByPlan.set(r.invoice.planId, (paidByPlan.get(r.invoice.planId) ?? 0) + 1);
    return (
      <Shell>
        <BillingView
          user={user.name ?? user.email ?? "owner"}
          data={{
            payments: payments.map((r) => ({
              id: r.payment.id,
              invoice: r.invoice.number,
              provider: r.payment.provider,
              method: r.payment.method,
              amountCents: r.payment.amountCents,
              tipCents: r.payment.tipCents,
              surchargeCents: r.payment.surchargeCents,
              refundedCents: r.payment.refundedCents,
              status: r.payment.status,
              at: (r.payment.paidAt ?? r.payment.createdAt).toISOString().slice(0, 16).replace("T", " "),
            })),
            plans: plans.map((p) => ({
              id: p.id,
              name: p.name,
              totalCents: p.totalCents,
              count: p.count,
              paid: paidByPlan.get(p.id) ?? 0,
            })),
            recurring: recurring.map((r) => ({
              id: r.id,
              description: r.description,
              amountCents: r.amountCents,
              months: r.intervalMonths,
              next: r.nextRunOn,
              active: r.active,
            })),
            jobs: jobs.map((r) => ({ id: r.job.id, title: r.job.title })),
            settings: {
              tips: settings.tipsEnabled,
              percents: settings.tipPercents.join(", "),
              ach: settings.achEnabled,
              surcharge: settings.surchargeEnabled,
              surchargePercent: (settings.surchargeBp / 100).toString(),
            },
            stripe: Boolean(process.env.STRIPE_SECRET_KEY),
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
  if (section === "orders") {
    const sheets = await shopDb.listSheets(db);
    const perSheet = await Promise.all(sheets.map((x) => shopDb.listProducts(db, { sheetId: x.id })));
    const orders = await shopDb.listOrders(db);
    return (
      <Shell>
        <OrdersView
          data={{
            sheets: sheets.map((x) => ({ id: x.id, name: x.name, isDefault: x.isDefault })),
            products: perSheet.flat().map((p) => ({
              id: p.id,
              sheetId: p.sheetId ?? sheets[0].id,
              kind: p.kind,
              name: p.name,
              description: p.description ?? "",
              price: (p.priceCents / 100).toFixed(2),
              sample: p.sample,
              active: p.active,
            })),
            orders: orders.slice(0, 100).map((o) => ({
              id: o.order.id,
              number: o.order.number,
              gallery: o.gallery.title,
              galleryId: o.gallery.id,
              status: o.order.status,
              buyer: `${o.order.buyerName} <${o.order.buyerEmail}>`,
              totalCents: o.order.totalCents,
              at: o.order.createdAt.toISOString().slice(0, 16).replace("T", " "),
              lab: o.order.labOrderId,
              items: o.items.map((i) => `${i.name}${i.qty > 1 ? ` × ${i.qty}` : ""}`),
            })),
          }}
        />
      </Shell>
    );
  }
  if (section === "visitors") {
    const rows = await extras.listVisitors(db);
    return (
      <Shell>
        <VisitorsView
          rows={rows.map((r) => ({
            id: r.visitor.id,
            email: r.visitor.email,
            name: r.visitor.name ?? "",
            gallery: r.gallery.title,
            galleryId: r.gallery.id,
            visits: r.visitor.visits,
            last: r.visitor.lastAt.toISOString().slice(0, 10),
          }))}
        />
      </Shell>
    );
  }
  if (section === "music") {
    const tracks = await extras.listTracks(db);
    const { limits } = await planDb.planOverview(db);
    return (
      <Shell>
        <MusicView
          allowed={limits.music}
          tracks={tracks.map((t) => ({
            id: t.id,
            title: t.title,
            artist: t.artist ?? "",
            mb: (t.bytes / 1_048_576).toFixed(1),
          }))}
        />
      </Shell>
    );
  }
  if (section === "watermarks") {
    const marks = await extras.listWatermarks(db);
    return (
      <Shell>
        <WatermarksView
          marks={marks.map((m) => ({
            id: m.id,
            name: m.name,
            kind: m.kind,
            text: m.text ?? "",
            position: m.position,
            opacity: m.opacity,
            sizePct: m.sizePct,
            isDefault: m.isDefault,
          }))}
        />
      </Shell>
    );
  }
  if (section === "brand") {
    const brand = await brandDb.getBrand(db);
    return (
      <Shell>
        <BrandView brand={brand} />
      </Shell>
    );
  }
  if (section === "users") {
    const rows = await db.select().from(schema.users).orderBy(schema.users.createdAt);
    return (
      <Shell>
        <UsersView
          users={rows.map((u) => ({
            id: u.id,
            name: u.name ?? "",
            email: u.email,
            role: u.role,
            active: u.active,
            since: u.createdAt.toISOString().slice(0, 10),
          }))}
        />
      </Shell>
    );
  }
  if (section === "plan") {
    await planDb.billThisMonth(db).catch(() => null);
    const o = await planDb.planOverview(db);
    const charges = await planDb.listPlanCharges(db);
    const lines = (k: "free" | "fullframe") => {
      const l = planDb.PLANS[k];
      return [
        l.galleries === null ? "Unlimited active galleries" : `${l.galleries} active galleries`,
        `${Math.round(l.storageBytes / 1024 ** 3).toLocaleString()} GB of photographs`,
        `${l.photosPerGallery.toLocaleString()} photographs per gallery`,
        l.shop ? "Store: prints and downloads" : "No store",
        l.music ? "Gallery music" : "No gallery music",
        l.reports ? "Reports" : "No reports",
        `${l.downloadRules} free-download rule${l.downloadRules === 1 ? "" : "s"} per gallery`,
      ];
    };
    return (
      <Shell>
        <PlanView
          data={{
            plan: o.state.plan,
            name: o.limits.name,
            discountPct: o.state.discountPct,
            since: o.state.since,
            dueCents: o.due,
            priceCents: o.limits.priceCents,
            usage: o.usage,
            limits: o.limits,
            plans: (["free", "fullframe"] as const).map((k) => ({
              key: k,
              name: planDb.PLANS[k].name,
              tagline: planDb.PLANS[k].tagline,
              priceCents: planDb.PLANS[k].priceCents,
              lines: lines(k),
            })),
            charges: charges.map((c) => ({
              id: c.id,
              description: c.description,
              amountCents: c.amountCents,
              status: c.status,
              at: c.at.toISOString().slice(0, 10),
            })),
            billing:
              process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_FULLFRAME
                ? "stripe"
                : mocksEnabled()
                  ? "mock"
                  : "none",
          }}
        />
      </Shell>
    );
  }
  if (section === "reports") {
    const o = await planDb.planOverview(db);
    const tab = (["sales", "orders", "files", "products", "invoices"] as const).find((t) => t === q.tab) ?? "sales";
    const days = [7, 30, 90, 365].includes(Number(q.days)) ? Number(q.days) : 30;
    const range = reportsDb.lastDays(days);
    const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
    let summary: { label: string; value: string }[] = [];
    let table = { head: [] as string[], rows: [] as string[][] };
    if (o.limits.reports) {
      if (tab === "sales") {
        const r = await reportsDb.salesReport(db, range);
        summary = [
          { label: "Received", value: usd(r.totalCents) },
          { label: "From the store", value: usd(r.shopCents) },
          { label: "Refunded", value: usd(r.refundedCents) },
          { label: "Net", value: usd(r.netCents) },
        ];
        table = {
          head: ["Day", "Store", "Other", "Refunded"],
          rows: r.days.map((d) => [d.day, usd(d.shopCents), usd(d.otherCents), usd(d.refundedCents)]),
        };
      } else if (tab === "orders") {
        const r = await reportsDb.ordersReport(db, range);
        summary = [
          { label: "Orders", value: String(r.length) },
          {
            label: "Paid",
            value: String(r.filter((x) => x.order.status === "paid" || x.order.status === "fulfilled").length),
          },
          { label: "Waiting for payment", value: String(r.filter((x) => x.order.status === "pending").length) },
        ];
        table = {
          head: ["Order", "Date", "Gallery", "Buyer", "Items", "Total", "Status"],
          rows: r.map((x) => [
            x.order.number,
            x.order.createdAt.toISOString().slice(0, 10),
            x.gallery.title,
            x.order.buyerName,
            String(x.items.length),
            usd(x.order.totalCents),
            x.order.status,
          ]),
        };
      } else if (tab === "files") {
        const r = await reportsDb.orderFilesReport(db, range);
        summary = [
          { label: "Downloads", value: String(r.reduce((n, x) => n + x.n, 0)) },
          { label: "Data delivered", value: `${(r.reduce((n, x) => n + x.bytes, 0) / 1_048_576).toFixed(1)} MB` },
        ];
        table = {
          head: ["Gallery", "Kind", "Downloads", "Size"],
          rows: r.map((x) => [x.gallery, x.kind, String(x.n), `${(x.bytes / 1_048_576).toFixed(1)} MB`]),
        };
      } else if (tab === "products") {
        const r = await reportsDb.productsReport(db, range);
        summary = [
          { label: "Units sold", value: String(r.reduce((n, x) => n + x.units, 0)) },
          { label: "Revenue", value: usd(r.reduce((n, x) => n + x.cents, 0)) },
        ];
        table = {
          head: ["Product", "Kind", "Units", "Revenue"],
          rows: r.map((x) => [x.name, x.kind, String(x.units), usd(x.cents)]),
        };
      } else {
        const r = await reportsDb.invoicesReport(db, range);
        summary = r.totals.map((t) => ({ label: `${t.status} (${t.n})`, value: usd(t.cents) }));
        table = {
          head: ["Number", "Date", "Job", "Total", "Status"],
          rows: r.rows.map((x) => [
            x.invoice.number,
            x.invoice.createdAt.toISOString().slice(0, 10),
            x.job.title,
            usd(x.invoice.totalCents),
            x.invoice.status,
          ]),
        };
      }
    }
    return (
      <Shell>
        <ReportsView data={{ tab, days, allowed: o.limits.reports, summary, table }} />
      </Shell>
    );
  }
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
