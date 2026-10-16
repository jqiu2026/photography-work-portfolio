"use client";

import Link from "next/link";
import { useState } from "react";
import type { DashboardData } from "@/lib/studio-dashboard";
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
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
};

export function DashboardView({ greeting, data }: { greeting: string; data: DashboardData }) {
  const { revenue, stats } = data;
  const max = Math.max(1, ...revenue.days.map((d) => d.cents));
  const [hover, setHover] = useState<number | null>(null);
  const delta = revenue.previousCents
    ? Math.round(((revenue.totalCents - revenue.previousCents) / revenue.previousCents) * 100)
    : null;
  const shown = hover === null ? null : revenue.days[hover];

  return (
    <div className="st-wrap db" style={{ "--hue": 210 } as React.CSSProperties}>
      <header className="st-head">
        <p className="st-crumb">Overview</p>
        <h1 className="st-title">{greeting}</h1>
        <nav className="st-tabs" aria-label="Overview pages">
          <Link href="/studio/overview" aria-current="page">
            Overview
          </Link>
          <Link href="/studio/activity">Activity</Link>
        </nav>
      </header>

      <div className="db-stats">
        <div className="db-stat">
          <p className="db-label">Revenue, 30 days</p>
          <p className="db-value">{usd(revenue.totalCents)}</p>
          <p className="db-delta" data-up={delta !== null && delta >= 0 ? "" : undefined}>
            {delta === null
              ? "No earlier period yet"
              : `${delta >= 0 ? "Up" : "Down"} ${Math.abs(delta)}% on the 30 days before`}
          </p>
        </div>
        <div className="db-stat">
          <p className="db-label">Upcoming</p>
          <p className="db-value">{stats.upcoming}</p>
          <p className="db-delta">appointments, next 3 weeks</p>
        </div>
        <div className="db-stat">
          <p className="db-label">Active clients</p>
          <p className="db-value">{stats.activeClients}</p>
          <p className="db-delta">with an open job</p>
        </div>
        <div className="db-stat">
          <p className="db-label">To deliver</p>
          <p className="db-value">{stats.deliveries}</p>
          <p className="db-delta">published galleries</p>
        </div>
      </div>

      <section className="db-section" aria-labelledby="db-rev">
        <div className="db-head">
          <h2 id="db-rev">Revenue</h2>
          <p aria-live="polite">{shown ? `${shown.label} · ${usd(shown.cents)}` : "Last 30 days"}</p>
        </div>
        {revenue.totalCents ? (
          <>
            <div className="db-bars" onPointerLeave={() => setHover(null)}>
              {revenue.days.map((d, i) => (
                <button
                  key={d.label}
                  type="button"
                  className="db-bar"
                  data-on={hover === i ? "" : undefined}
                  style={{ "--h": `${Math.max(2, (d.cents / max) * 100)}%`, "--i": i } as React.CSSProperties}
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  aria-label={`${d.label}: ${usd(d.cents)}`}
                />
              ))}
            </div>
            <div className="db-axis" aria-hidden="true">
              <span>{revenue.days[0]?.label}</span>
              <span>{revenue.days[29]?.label}</span>
            </div>
          </>
        ) : (
          <p className="db-empty">No payments in the last 30 days.</p>
        )}
      </section>

      <div className="db-two">
        <section className="db-section" aria-labelledby="db-up">
          <div className="db-head">
            <h2 id="db-up">Upcoming</h2>
            <Link href="/studio/calendar">Calendar</Link>
          </div>
          {data.upcoming.length ? (
            <ul className="db-rows">
              {data.upcoming.map((a) => (
                <li key={a.id}>
                  <span>
                    {a.title}
                    <small>{[when(a.when), a.location].filter(Boolean).join(" · ")}</small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="db-empty">Nothing in the next three weeks.</p>
          )}
        </section>

        <section className="db-section" aria-labelledby="db-need">
          <div className="db-head">
            <h2 id="db-need">Needs attention</h2>
          </div>
          <ul className="db-rows">
            <li>
              <Link href="/studio/bookings">
                {stats.newInquiries} new {stats.newInquiries === 1 ? "inquiry" : "inquiries"}
              </Link>
            </li>
            <li>
              <Link href="/studio/invoices">
                {stats.unpaidCount} unpaid {stats.unpaidCount === 1 ? "invoice" : "invoices"}
              </Link>
              <em>{usd(stats.unpaidCents)}</em>
            </li>
            {data.tasks.map((t) => (
              <li key={t.id}>
                <Link href="/studio/tasks">{t.title}</Link>
                {t.dueOn ? <em>{t.dueOn}</em> : null}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="db-two">
        <section className="db-section" aria-labelledby="db-act">
          <div className="db-head">
            <h2 id="db-act">Recent activity</h2>
            <Link href="/studio/activity">All</Link>
          </div>
          {data.activity.length ? (
            <ul className="db-rows">
              {data.activity.slice(0, 6).map((n) => (
                <li key={n.id}>
                  <span>
                    {n.title}
                    {n.body ? <small>{n.body}</small> : null}
                  </span>
                  <time>{ago(n.at)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="db-empty">Bookings, payments and galleries show up here.</p>
          )}
        </section>

        <section className="db-section" aria-labelledby="db-gal">
          <div className="db-head">
            <h2 id="db-gal">Galleries</h2>
            <Link href="/studio/galleries">All</Link>
          </div>
          {data.galleries.length ? (
            <ul className="db-rows">
              {data.galleries.map((g) => (
                <li key={g.id}>
                  <Link href={`/studio/gallery/${g.id}`}>
                    {g.title}
                    <small>{g.jobTitle}</small>
                  </Link>
                  <em>{g.status}</em>
                </li>
              ))}
            </ul>
          ) : (
            <p className="db-empty">No client galleries yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
