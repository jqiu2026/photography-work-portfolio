"use client";

import {
  Button,
  DownloadIcon,
  EmptyState,
  PageTab,
  PageTabs,
  Stat,
  StatGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@holominimal/ui";

import Link from "next/link";
import { Card, Frame, useAct } from "./StudioFrame";
import "./records.css";
import "./galleries.css";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const mb = (b: number) => `${(b / 1_048_576).toFixed(1)} MB`;
type ReportTable = { head: string[]; rows: string[][] };
export type ReportData = {
  tab: "sales" | "orders" | "files" | "products" | "invoices" | "rate" | "storage";
  days: number;
  allowed: boolean;
  summary: { label: string; value: string }[];
  table: ReportTable;
};
const TABS: [ReportData["tab"], string][] = [
  ["sales", "Sales"],
  ["orders", "Orders"],
  ["files", "Downloads"],
  ["products", "Products"],
  ["invoices", "Invoices"],
  ["rate", "Hourly rate"],
  ["storage", "Storage"],
];

/** One report at a time: sales, shop orders, files delivered, products sold, invoices, true hourly rate, storage cost. Pick a period; download the table as CSV. */
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
  // a column is numeric (right-aligned) when every value in it is an amount, a count or a percentage
  const NUM = /^[-−]?[$€]?[\d,]+(\.\d+)?%?$/;
  const numericCol = data.table.head.map(
    (_, j) => data.table.rows.length > 0 && data.table.rows.every((r) => NUM.test((r[j] ?? "").trim())),
  );
  return (
    <Frame section="reports" note={note}>
      {!data.allowed ? (
        <Card title="Reports are part of Full Frame" id="rp-locked">
          <Text size="sm" tone="muted">
            See sales, orders, files delivered, products, invoices, your true hourly rate and storage cost for any
            period.
          </Text>
          <div>
            <Button asChild>
              <Link href="/studio/plan">See plans</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="rp-bar">
            <PageTabs aria-label="Reports">
              {TABS.map(([k, label]) => (
                <PageTab key={k} asChild current={k === data.tab}>
                  <Link href={`/studio/reports?tab=${k}&days=${data.days}`}>{label}</Link>
                </PageTab>
              ))}
            </PageTabs>
            <nav className="rp-period" aria-label="Period">
              {[7, 30, 90, 365].map((d) => (
                <Button key={d} asChild size="sm" variant={d === data.days ? "primary" : "ghost"}>
                  <Link
                    href={`/studio/reports?tab=${data.tab}&days=${d}`}
                    aria-current={d === data.days ? "true" : undefined}
                  >
                    {d === 365 ? "Year" : `${d} days`}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
          <StatGroup className="st-statrow">
            {data.summary.map((s) => (
              <Stat key={s.label} label={s.label} value={s.value} />
            ))}
          </StatGroup>
          {data.tab === "rate" ? (
            <Text size="sm" tone="muted">
              Hours are what the calendar blocked for each shoot, with buffers and travel. Editing time is not tracked,
              so the rate reads high for jobs with a lot of editing.
            </Text>
          ) : null}
          {data.tab === "storage" ? (
            <Text size="sm" tone="muted">
              An estimate at 2.3 cents per gigabyte per month for the originals; check the current Vercel Blob price. It
              does not depend on the period.
            </Text>
          ) : null}
          {data.table.rows.length ? (
            <>
              <Table containerLabel="Report table" containerClassName="rp-table">
                <TableHeader>
                  <TableRow>
                    {data.table.head.map((h) => (
                      <TableHead key={h} align={numericCol[data.table.head.indexOf(h)] ? "end" : "start"}>
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.table.rows.map((r, i) => (
                    <TableRow key={i}>
                      {r.map((c, j) => (
                        <TableCell key={j} numeric={numericCol[j]} data-label={data.table.head[j]}>
                          {c}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div>
                <Button variant="secondary" onClick={csv}>
                  <DownloadIcon /> Download CSV
                </Button>
              </div>
            </>
          ) : (
            <EmptyState>Nothing in this period.</EmptyState>
          )}
        </>
      )}
    </Frame>
  );
}
export { mb, usd };
