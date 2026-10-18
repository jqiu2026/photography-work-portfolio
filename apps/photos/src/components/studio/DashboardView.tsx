"use client";

import {
  ArrowRightIcon,
  BarChart,
  Button,
  DataList,
  DataListItem,
  EmptyState,
  ImagePlusIcon,
  InboxIcon,
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
const when = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: NY,
  }).format(new Date(iso));
const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};
const GALLERY_TONE: Record<string, "success" | "warning" | "muted" | "neutral"> = {
  published: "success",
  draft: "neutral",
  expired: "warning",
  archived: "muted",
};

/** One of the "start something" cards: a whole-card link on the holographic surface. */
function Quick({ href, icon, title, detail }: { href: string; icon: ReactNode; title: string; detail: string }) {
  return (
    <Surface asChild variant="holo" interactive lit padding="md" className="db-quick__card">
      <Link href={href}>
        <span className="db-quick__icon" aria-hidden="true">
          {icon}
        </span>
        <strong>{title}</strong>
        <span>{detail}</span>
      </Link>
    </Surface>
  );
}

function Section({ id, title, more, children }: { id: string; title: string; more?: ReactNode; children: ReactNode }) {
  return (
    <section className="db-section" aria-labelledby={id}>
      <div className="db-head">
        <h2 id={id}>{title}</h2>
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

export function DashboardView({ greeting, data }: { greeting: string; data: DashboardData }) {
  const { revenue, stats } = data;
  const delta = revenue.previousCents
    ? Math.round(((revenue.totalCents - revenue.previousCents) / revenue.previousCents) * 100)
    : null;

  return (
    <div className="st-wrap db">
      <StudioHead section="overview" title={greeting} />

      <nav className="db-quick" aria-label="Start something">
        <Quick
          href="/studio/galleries?new=1"
          icon={<ImagePlusIcon />}
          title="New gallery"
          detail="Upload photos and share a link"
        />
        <Quick
          href="/studio/clients"
          icon={<UserPlusIcon />}
          title="Add a client"
          detail="Then a shoot, quote or invoice"
        />
        <Quick
          href="/studio/orders"
          icon={<ShoppingBagIcon />}
          title="Shop and orders"
          detail="Prints and downloads sold"
        />
        <Quick
          href="/studio/bookings"
          icon={<InboxIcon />}
          title="Inquiries"
          detail={stats.newInquiries ? `${stats.newInquiries} waiting for you` : "Nothing waiting"}
        />
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

      <Section id="db-rev" title="Revenue" more={<span className="db-caption">Last 30 days</span>}>
        <BarChart
          className="db-chart"
          title="Revenue"
          caption="Last 30 days"
          data={revenue.days.map((d) => ({ label: d.label, value: d.cents / 100 }))}
          format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
          empty="No payments in the last 30 days."
        />
      </Section>

      <div className="db-two">
        <Section id="db-up" title="Upcoming" more={<More href="/studio/calendar">Calendar</More>}>
          {data.upcoming.length ? (
            <DataList>
              {data.upcoming.map((a) => (
                <DataListItem key={a.id} description={[when(a.when), a.location].filter(Boolean).join(" · ")}>
                  {a.title}
                </DataListItem>
              ))}
            </DataList>
          ) : (
            <EmptyState>Nothing in the next three weeks.</EmptyState>
          )}
        </Section>

        <Section id="db-need" title="Needs attention">
          <DataList>
            <DataListItem meta={stats.newInquiries ? <Status tone="accent">new</Status> : undefined}>
              <Link href="/studio/bookings">
                {stats.newInquiries} new {stats.newInquiries === 1 ? "inquiry" : "inquiries"}
              </Link>
            </DataListItem>
            <DataListItem meta={<span className="db-num">{usd(stats.unpaidCents)}</span>}>
              <Link href="/studio/invoices">
                {stats.unpaidCount} unpaid {stats.unpaidCount === 1 ? "invoice" : "invoices"}
              </Link>
            </DataListItem>
            {data.tasks.map((t) => (
              <DataListItem key={t.id} meta={t.dueOn ? <span className="db-num">{t.dueOn}</span> : undefined}>
                <Link href="/studio/tasks">{t.title}</Link>
              </DataListItem>
            ))}
          </DataList>
        </Section>
      </div>

      <div className="db-two">
        <Section id="db-act" title="Recent activity" more={<More href="/studio/activity">All activity</More>}>
          {data.activity.length ? (
            <DataList>
              {data.activity.slice(0, 6).map((n) => (
                <DataListItem
                  key={n.id}
                  description={n.body || undefined}
                  meta={<time dateTime={n.at}>{ago(n.at)}</time>}
                >
                  {n.title}
                </DataListItem>
              ))}
            </DataList>
          ) : (
            <EmptyState>Bookings, payments and galleries show up here.</EmptyState>
          )}
        </Section>

        <Section id="db-gal" title="Galleries" more={<More href="/studio/galleries">All galleries</More>}>
          {data.galleries.length ? (
            <DataList>
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
