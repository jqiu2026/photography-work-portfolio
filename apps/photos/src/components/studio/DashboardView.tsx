"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

/** Counts up to `value` once on mount (instant with reduced motion). */
function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(value);
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1100);
      setN(value * (1 - (1 - p) ** 4));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(Math.round(n))}</>;
}

/** Cards that tilt toward the pointer and carry a light sheen where it is. */
function Tilt({ className = "", children, ...rest }: React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - y) * 5).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((x - 0.5) * 7).toFixed(2)}deg`);
    el.style.setProperty("--px", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--py", `${(y * 100).toFixed(1)}%`);
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <section ref={ref} className={`st-card st-tilt ${className}`} onPointerMove={move} onPointerLeave={reset} {...rest}>
      {children}
    </section>
  );
}

function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${28 - (v / max) * 24}`);
  return (
    <svg className="db-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts.join(" ")} pathLength={1} />
    </svg>
  );
}

const STATS = [
  { key: "revenue", label: "Revenue, last 30 days", icon: "◈" },
  { key: "upcoming", label: "Upcoming appointments", sub: "next 3 weeks", icon: "◷" },
  { key: "activeClients", label: "Active clients", sub: "with an open job", icon: "◉" },
  { key: "deliveries", label: "Galleries to deliver", sub: "published, not delivered", icon: "▣" },
] as const;

export function DashboardView({ greeting, data }: { greeting: string; data: DashboardData }) {
  const { revenue, stats } = data;
  const max = Math.max(1, ...revenue.days.map((d) => d.cents));
  const [hover, setHover] = useState<number | null>(null);
  const delta = revenue.previousCents
    ? Math.round(((revenue.totalCents - revenue.previousCents) / revenue.previousCents) * 100)
    : null;
  const shown = hover === null ? null : revenue.days[hover];

  return (
    <div className="st-wrap db">
      <header className="st-head db-hello">
        <p className="hl-eyebrow">
          <span className="db-live" aria-hidden="true" /> Studio · live
        </p>
        <h1 className="st-title">{greeting}</h1>
        <p className="db-sub">Here is what is happening with the studio today.</p>
      </header>

      <div className="db-stats" role="list">
        {STATS.map((s, i) => (
          <Tilt key={s.key} className="db-stat" style={{ "--i": i } as React.CSSProperties} role="listitem">
            <span className="db-icon" aria-hidden="true">
              {s.icon}
            </span>
            <p className="db-label">{s.label}</p>
            <p className="db-value">
              {s.key === "revenue" ? (
                <CountUp value={revenue.totalCents} format={usd} />
              ) : (
                <CountUp value={stats[s.key]} format={(n) => String(n)} />
              )}
            </p>
            {s.key === "revenue" ? (
              <>
                {revenue.totalCents ? <Spark values={revenue.days.map((d) => d.cents)} /> : null}
                <p className="db-delta" data-up={delta !== null && delta >= 0 ? "" : undefined}>
                  {delta === null
                    ? "No earlier period yet"
                    : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}% vs the 30 days before`}
                </p>
              </>
            ) : (
              <p className="db-delta">{s.sub}</p>
            )}
          </Tilt>
        ))}
      </div>

      <div className="db-main">
        <Tilt className="db-chart" style={{ "--i": 4 } as React.CSSProperties} aria-labelledby="db-rev">
          <div className="db-card-head">
            <h2 id="db-rev">Revenue overview</h2>
            <p className="db-readout" aria-live="polite">
              {shown ? `${shown.label}: ${usd(shown.cents)}` : "Last 30 days · hover a bar"}
            </p>
          </div>
          {revenue.totalCents ? (
            <div className="db-bars" onPointerLeave={() => setHover(null)}>
              {revenue.days.map((d, i) => (
                <button
                  key={d.label}
                  type="button"
                  className="db-bar"
                  data-on={hover === i ? "" : undefined}
                  style={{ "--h": `${Math.max(3, (d.cents / max) * 100)}%`, "--i": i } as React.CSSProperties}
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  aria-label={`${d.label}: ${usd(d.cents)}`}
                />
              ))}
            </div>
          ) : (
            <p className="st-note db-empty">No payments in the last 30 days. Paid invoices will draw here.</p>
          )}
          <div className="db-axis" aria-hidden="true">
            <span>{revenue.days[0]?.label}</span>
            <span>{revenue.days[14]?.label}</span>
            <span>{revenue.days[29]?.label}</span>
          </div>
        </Tilt>

        <Tilt style={{ "--i": 5 } as React.CSSProperties} aria-labelledby="db-up">
          <div className="db-card-head">
            <h2 id="db-up">Upcoming</h2>
            <Link href="/studio/calendar">Calendar →</Link>
          </div>
          {data.upcoming.length ? (
            <ul className="db-rows">
              {data.upcoming.map((a) => (
                <li key={a.id}>
                  <span className="db-dot" aria-hidden="true" />
                  <span>
                    <strong>{a.title}</strong>
                    <small>{[when(a.when), a.location].filter(Boolean).join(" · ")}</small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">Nothing on the calendar in the next three weeks.</p>
          )}
        </Tilt>

        <Tilt style={{ "--i": 6 } as React.CSSProperties} aria-labelledby="db-act">
          <div className="db-card-head">
            <h2 id="db-act">Recent activity</h2>
            <Link href="/studio/activity">All →</Link>
          </div>
          {data.activity.length ? (
            <ul className="db-rows">
              {data.activity.slice(0, 6).map((n) => (
                <li key={n.id}>
                  <span className="db-dot db-dot--soft" aria-hidden="true" />
                  <span>
                    <strong>{n.title}</strong>
                    <small>{n.body ? `${n.body} · ${ago(n.at)}` : ago(n.at)}</small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">Activity from bookings, payments and galleries appears here.</p>
          )}
        </Tilt>
      </div>

      <div className="db-low">
        <Tilt style={{ "--i": 7 } as React.CSSProperties} aria-labelledby="db-need">
          <div className="db-card-head">
            <h2 id="db-need">Needs attention</h2>
          </div>
          <ul className="db-rows">
            <li>
              <span className="db-dot" aria-hidden="true" />
              <span>
                <Link href="/studio/bookings">
                  <strong>{stats.newInquiries}</strong> new {stats.newInquiries === 1 ? "inquiry" : "inquiries"}
                </Link>
              </span>
            </li>
            <li>
              <span className="db-dot" aria-hidden="true" />
              <span>
                <Link href="/studio/invoices">
                  <strong>{stats.unpaidCount}</strong> unpaid {stats.unpaidCount === 1 ? "invoice" : "invoices"} ·{" "}
                  {usd(stats.unpaidCents)}
                </Link>
              </span>
            </li>
            {data.tasks.map((t) => (
              <li key={t.id}>
                <span className="db-dot db-dot--soft" aria-hidden="true" />
                <span>
                  <Link href="/studio/tasks">{t.title}</Link>
                  {t.dueOn ? <small>Due {t.dueOn}</small> : null}
                </span>
              </li>
            ))}
          </ul>
        </Tilt>

        <Tilt style={{ "--i": 8 } as React.CSSProperties} aria-labelledby="db-gal">
          <div className="db-card-head">
            <h2 id="db-gal">Galleries</h2>
            <Link href="/studio/galleries">All →</Link>
          </div>
          {data.galleries.length ? (
            <ul className="db-tiles">
              {data.galleries.map((g, i) => (
                <li key={g.id} style={{ "--hue": `${(i * 67 + 190) % 360}` } as React.CSSProperties}>
                  <Link href={`/studio/gallery/${g.id}`}>
                    <strong>{g.title}</strong>
                    <small>
                      {g.jobTitle} · {g.status}
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="st-note">No client galleries yet.</p>
          )}
        </Tilt>

        <Tilt style={{ "--i": 9 } as React.CSSProperties} aria-labelledby="db-go">
          <div className="db-card-head">
            <h2 id="db-go">Jump to</h2>
          </div>
          <div className="db-chips">
            {[
              ["Pipeline", "/studio/pipeline"],
              ["Quotes", "/studio/quotes"],
              ["Invoices", "/studio/invoices"],
              ["Inbox", "/studio/inbox"],
              ["Clients", "/studio/clients"],
              ["Portal", "/studio/portal"],
              ["Automations", "/studio/automations"],
              ["Health", "/studio/health"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="db-chip">
                {label}
              </Link>
            ))}
          </div>
        </Tilt>
      </div>
    </div>
  );
}
