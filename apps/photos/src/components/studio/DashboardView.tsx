"use client";

import {
  ArrowRightIcon,
  Badge,
  BarChart,
  Button,
  DataList,
  DataListItem,
  EmptyState,
  CheckSquareIcon,
  ImagePlusIcon,
  InboxIcon,
  ReceiptIcon,
  SendIcon,
  ShoppingBagIcon,
  Stat,
  StatGroup,
  Status,
  Surface,
  UserPlusIcon,
} from "@holominimal/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DashboardData } from "@/lib/studio-dashboard";
import { StudioHead } from "./StudioFrame";
import "./studio-dashboard.css";

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
const NY = "America/New_York";
const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};
const GALLERY_TONE: Record<string, Tone> = {
  published: "success",
  draft: "neutral",
  expired: "warning",
  archived: "muted",
};
type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "muted" | "info";
const ACTIVITY: Record<string, { label: string; tone: Tone }> = {
  booking: { label: "Booking", tone: "accent" },
  inquiry: { label: "Inquiry", tone: "accent" },
  payment: { label: "Payment", tone: "success" },
  gallery: { label: "Gallery", tone: "info" },
  quote: { label: "Quote", tone: "warning" },
};

/** Today in New York as YYYY-MM-DD, and whole days from today to a date (negative when it has passed). */
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: NY }).format(new Date());
const daysUntil = (ymd: string) => Math.round((Date.parse(ymd) - Date.parse(today())) / 86_400_000);
function dueBadge(ymd: string): { tone: Tone; text: string } {
  const d = daysUntil(ymd);
  if (d < 0) return { tone: "danger", text: d === -1 ? "1 day late" : `${-d} days late` };
  if (d === 0) return { tone: "warning", text: "Due today" };
  if (d === 1) return { tone: "warning", text: "Tomorrow" };
  if (d <= 7) return { tone: "accent", text: `In ${d} days` };
  return {
    tone: "neutral",
    text: new Date(`${ymd}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}
const dayOf = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: NY }).format(new Date(iso));
const soon = (iso: string): { tone: Tone; text: string } | null => {
  const d = daysUntil(dayOf(iso));
  return d <= 0 ? { tone: "warning", text: "Today" } : d === 1 ? { tone: "accent", text: "Tomorrow" } : null;
};
const part = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...o, timeZone: NY }).format(new Date(iso));

/** One of the "start something" cards: a whole-card link on the holographic surface, icon, words, then an arrow. */
function Quick({
  href,
  icon,
  title,
  detail,
  hue,
  count,
}: { href: string; icon: ReactNode; title: string; detail: string; hue: number; count?: number }) {
  return (
    <Surface
      asChild
      variant="holo"
      interactive
      lit
      padding="none"
      className="db-quick__card"
      style={{ "--db-hue": hue } as React.CSSProperties}
    >
      <Link href={href}>
        <span className="db-quick__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="db-quick__text">
          <strong>
            {title}
            {count ? (
              <Badge tone="accent" className="db-quick__count">
                {count}
              </Badge>
            ) : null}
          </strong>
          <span>{detail}</span>
        </span>
        <ArrowRightIcon className="db-quick__go" animate="nudge-right" animateOn="group" aria-hidden="true" />
      </Link>
    </Surface>
  );
}

function Section({
  id,
  title,
  count,
  more,
  children,
}: { id: string; title: string; count?: ReactNode; more?: ReactNode; children: ReactNode }) {
  return (
    <section className="db-section" aria-labelledby={id}>
      <div className="db-head">
        <div className="db-title">
          <h2 id={id}>{title}</h2>
          {count}
        </div>
        {more}
      </div>
      {children}
    </section>
  );
}

const More = ({ href, children }: { href: string; children: ReactNode }) => (
  <Button asChild variant="ghost" size="sm">
    <Link href={href}>
      {children} <ArrowRightIcon />
    </Link>
  </Button>
);

/** A row icon in a tinted square, coloured by what the row is about. */
const Mark = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className="db-mark" data-tone={tone} aria-hidden="true">
    {children}
  </span>
);

export function DashboardView({ greeting, data }: { greeting: string; data: DashboardData }) {
  const { revenue, stats } = data;
  const delta = revenue.previousCents
    ? Math.round(((revenue.totalCents - revenue.previousCents) / revenue.previousCents) * 100)
    : null;
  const need: { key: string; href: string; icon: ReactNode; tone: Tone; title: string; badge: ReactNode }[] = [];
  if (stats.newInquiries)
    need.push({
      key: "inq",
      href: "/studio/bookings",
      icon: <InboxIcon />,
      tone: "accent",
      title: `${stats.newInquiries} new ${stats.newInquiries === 1 ? "inquiry" : "inquiries"}`,
      badge: <Badge tone="accent">Reply</Badge>,
    });
  if (stats.unpaidCount)
    need.push({
      key: "inv",
      href: "/studio/invoices",
      icon: <ReceiptIcon />,
      tone: "warning",
      title: `${stats.unpaidCount} unpaid ${stats.unpaidCount === 1 ? "invoice" : "invoices"}`,
      badge: <Badge tone="warning">{usd(stats.unpaidCents)} due</Badge>,
    });
  if (stats.deliveries)
    need.push({
      key: "del",
      href: "/studio/galleries",
      icon: <SendIcon />,
      tone: "info",
      title: `${stats.deliveries} ${stats.deliveries === 1 ? "gallery" : "galleries"} to deliver`,
      badge: <Badge tone="info">Send</Badge>,
    });
  for (const t of data.tasks) {
    const b = t.dueOn ? dueBadge(t.dueOn) : null;
    need.push({
      key: t.id,
      href: "/studio/tasks",
      icon: <CheckSquareIcon />,
      tone: b?.tone === "danger" ? "danger" : "neutral",
      title: t.title,
      badge: b ? <Badge tone={b.tone}>{b.text}</Badge> : <Badge tone="muted">Task</Badge>,
    });
  }

  return (
    <div className="st-wrap db">
      <StudioHead section="overview" title={greeting} />

      <nav className="db-quick" aria-label="Start something">
        <Quick
          href="/studio/galleries?new=1"
          icon={<ImagePlusIcon />}
          title="New gallery"
          detail="Upload and share"
          hue={330}
        />
        <Quick
          href="/studio/clients"
          icon={<UserPlusIcon />}
          title="Add a client"
          detail="Then book the shoot"
          hue={265}
        />
        <Quick
          href="/studio/bookings"
          icon={<InboxIcon />}
          title="Inquiries"
          detail={stats.newInquiries ? "Waiting for a reply" : "Nothing waiting"}
          hue={210}
          count={stats.newInquiries}
        />
        <Quick href="/studio/orders" icon={<ShoppingBagIcon />} title="Store" detail="Prints and downloads" hue={150} />
      </nav>

      <StatGroup className="db-stats">
        <Stat
          label="Revenue, 30 days"
          value={usd(revenue.totalCents)}
          detail={
            delta === null
              ? "No earlier period yet"
              : `${delta >= 0 ? "Up" : "Down"} ${Math.abs(delta)}% on the 30 days before`
          }
          trend={delta === null ? undefined : delta >= 0 ? "up" : "down"}
        />
        <Stat label="Upcoming" value={stats.upcoming} detail="appointments, next 3 weeks" />
        <Stat label="Active clients" value={stats.activeClients} detail="with an open job" />
        <Stat label="To deliver" value={stats.deliveries} detail="published galleries" />
      </StatGroup>

      <div className="db-two">
        <Section
          id="db-need"
          title="Needs attention"
          count={
            need.length ? (
              <Badge tone={need.some((n) => n.tone === "danger") ? "danger" : "accent"}>{need.length}</Badge>
            ) : null
          }
        >
          {need.length ? (
            <DataList className="db-list">
              {need.map((n) => (
                <DataListItem key={n.key} meta={n.badge}>
                  <Link href={n.href} className="db-row">
                    <Mark tone={n.tone}>{n.icon}</Mark>
                    <span>{n.title}</span>
                  </Link>
                </DataListItem>
              ))}
            </DataList>
          ) : (
            <EmptyState>All caught up. Nothing needs you right now.</EmptyState>
          )}
        </Section>

        <Section id="db-up" title="Upcoming" more={<More href="/studio/calendar">Calendar</More>}>
          {data.upcoming.length ? (
            <DataList className="db-list">
              {data.upcoming.map((a) => {
                const b = soon(a.when);
                return (
                  <DataListItem
                    key={a.id}
                    description={[part(a.when, { weekday: "short", hour: "numeric", minute: "2-digit" }), a.location]
                      .filter(Boolean)
                      .join(" · ")}
                    meta={b ? <Badge tone={b.tone}>{b.text}</Badge> : undefined}
                  >
                    <span className="db-row">
                      <time className="db-date" dateTime={a.when}>
                        <small>{part(a.when, { month: "short" })}</small>
                        {part(a.when, { day: "numeric" })}
                      </time>
                      <span>{a.title}</span>
                    </span>
                  </DataListItem>
                );
              })}
            </DataList>
          ) : (
            <EmptyState>Nothing in the next three weeks.</EmptyState>
          )}
        </Section>
      </div>

      <Section id="db-rev" title="Revenue" more={<span className="db-caption">Last 30 days</span>}>
        {revenue.totalCents ? (
          <BarChart
            className="db-chart"
            title="Revenue"
            caption="Last 30 days"
            data={revenue.days.map((d) => ({ label: d.label, value: d.cents / 100 }))}
            format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
            empty="No payments in the last 30 days."
          />
        ) : (
          <EmptyState>No payments in the last 30 days. Paid invoices and store orders show up here.</EmptyState>
        )}
      </Section>

      <div className="db-two">
        <Section id="db-act" title="Recent activity" more={<More href="/studio/activity">All activity</More>}>
          {data.activity.length ? (
            <DataList className="db-list">
              {data.activity.slice(0, 6).map((n) => {
                const k = ACTIVITY[n.kind];
                return (
                  <DataListItem
                    key={n.id}
                    description={n.body || undefined}
                    meta={<time dateTime={n.at}>{ago(n.at)}</time>}
                  >
                    <span className="db-row db-row--top">
                      {k ? <Badge tone={k.tone}>{k.label}</Badge> : null}
                      <span>{n.title}</span>
                    </span>
                  </DataListItem>
                );
              })}
            </DataList>
          ) : (
            <EmptyState>Bookings, payments and galleries show up here.</EmptyState>
          )}
        </Section>

        <Section id="db-gal" title="Galleries" more={<More href="/studio/galleries">All galleries</More>}>
          {data.galleries.length ? (
            <DataList className="db-list">
              {data.galleries.map((g) => (
                <DataListItem
                  key={g.id}
                  description={g.jobTitle}
                  meta={<Status tone={GALLERY_TONE[g.status] ?? "neutral"}>{g.status}</Status>}
                >
                  <Link href={`/studio/gallery/${g.id}`}>{g.title}</Link>
                </DataListItem>
              ))}
            </DataList>
          ) : (
            <EmptyState>No client galleries yet.</EmptyState>
          )}
        </Section>
      </div>
    </div>
  );
}
