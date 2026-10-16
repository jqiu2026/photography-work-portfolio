"use client";

import Link from "next/link";
import { Frame, useAct } from "./StudioFrame";
import "./galleries.css";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const mb = (b: number) => `${(b / 1_048_576).toFixed(1)} MB`;
type Table = { head: string[]; rows: string[][] };
export type ReportData = {
  tab: "sales" | "orders" | "files" | "products" | "invoices";
  days: number;
  allowed: boolean;
  summary: { label: string; value: string }[];
  table: Table;
};
const TABS: [ReportData["tab"], string][] = [
  ["sales", "Sales"],
  ["orders", "Orders"],
  ["files", "Order files"],
  ["products", "Products"],
  ["invoices", "Invoices"],
];

/** One report at a time: sales, shop orders, files delivered, products sold, invoices. Pick a period; download the table as CSV. */
export function ReportsView({ data }: { data: ReportData }) {
  const { note } = useAct();
  const csv = () => {
    const body = [data.table.head, ...data.table.rows]
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
    a.download = `${data.tab}-report-${data.days}d.csv`;
    a.click();
  };
  return (
    <Frame section="reports" note={note}>
      {!data.allowed ? (
        <section className="st-card">
          <h2>Reports are part of Full Frame</h2>
          <p className="st-note">
            See sales, orders, files delivered, products and invoices for any period.{" "}
            <Link href="/studio/plan">Plan and billing</Link>
          </p>
        </section>
      ) : (
        <>
          <nav className="st-tabs" aria-label="Reports">
            {TABS.map(([k, label]) => (
              <Link
                key={k}
                href={`/studio/reports?tab=${k}&days=${data.days}`}
                aria-current={k === data.tab ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="gm-row" role="group" aria-label="Period">
            {[7, 30, 90, 365].map((d) => (
              <Link
                key={d}
                className="st-btn st-btn--ghost"
                href={`/studio/reports?tab=${data.tab}&days=${d}`}
                aria-current={d === data.days ? "true" : undefined}
              >
                {d === 365 ? "Year" : `${d} days`}
              </Link>
            ))}
          </div>
          <div className="gl-stats" style={{ display: "flex", gap: "2rem", flexWrap: "wrap", margin: "1rem 0" }}>
            {data.summary.map((s) => (
              <p key={s.label}>
                <strong>{s.value}</strong>
                <br />
                <small>{s.label}</small>
              </p>
            ))}
          </div>
          <section className="st-card" aria-label="Report table">
            {data.table.rows.length ? (
              <div style={{ overflowX: "auto" }}>
                <table className="rp-table">
                  <thead>
                    <tr>
                      {data.table.head.map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.table.rows.map((r, i) => (
                      <tr key={i}>
                        {r.map((c, j) => (
                          <td key={j}>{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="st-note">Nothing in this period.</p>
            )}
            {data.table.rows.length ? (
              <button type="button" className="st-btn st-btn--ghost" onClick={csv}>
                Download CSV
              </button>
            ) : null}
          </section>
        </>
      )}
    </Frame>
  );
}
export { mb, usd };
