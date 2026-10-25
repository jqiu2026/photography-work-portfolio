"use client";

import { Button } from "@holominimal/ui";
import Link from "next/link";
import { useEffect } from "react";
import type { DocModel } from "@/lib/doc-model";
import "./doc-paper.css";

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/** The document on a white sheet. Print hides everything but the sheet; "Save as PDF" is a real PDF file. */
export function DocPaper({
  doc,
  id,
  back,
  autoPrint,
}: { doc: DocModel; id: string; back: string; autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => window.print(), 350);
    return () => clearTimeout(t);
  }, [autoPrint]);
  return (
    <div className="dp-wrap">
      <div className="dp-bar">
        <Button asChild variant="ghost" size="sm">
          <Link href={back}>Back</Link>
        </Button>
        <span className="dp-spacer" />
        <Button variant="secondary" size="sm" onClick={() => window.print()}>
          Print
        </Button>
        <Button asChild size="sm">
          <a href={`/studio/pdf/${doc.kind}/${id}?download=1`}>Download PDF</a>
        </Button>
      </div>
      <article className="dp-sheet" aria-label={`${doc.heading} ${doc.number}`}>
        <header className="dp-head">
          <div>
            <p className="dp-biz">{doc.business}</p>
            <h1>{doc.kind === "contract" ? doc.heading : `${doc.heading} ${doc.number}`}</h1>
          </div>
          <span className="dp-status" data-status={doc.status}>
            {doc.status}
          </span>
        </header>
        <section className="dp-two">
          <div>
            <h2>For</h2>
            <p>
              <strong>{doc.to.name}</strong>
              <br />
              {doc.to.email}
              {doc.to.phone ? (
                <>
                  <br />
                  {doc.to.phone}
                </>
              ) : null}
              {doc.to.address ? (
                <>
                  <br />
                  <span className="dp-pre">{doc.to.address}</span>
                </>
              ) : null}
            </p>
          </div>
          <dl>
            {doc.meta.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        {doc.intro ? <p className="dp-pre">{doc.intro}</p> : null}
        {doc.fields.length ? (
          <section>
            <h2>Details</h2>
            <dl className="dp-fields">
              {doc.fields.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
        {doc.lines.length ? (
          <table className="dp-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col" className="dp-num">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {doc.lines.map((l, i) => (
                <tr key={`${l.description}${i}`}>
                  <td>
                    {l.description}
                    {l.detail ? <small> {l.detail}</small> : null}
                  </td>
                  <td className="dp-num">{usd(l.cents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {doc.totals.map(([k, v, strong]) => (
                <tr key={k} data-strong={strong || undefined}>
                  <th scope="row">{k}</th>
                  <td className="dp-num">{usd(v)}</td>
                </tr>
              ))}
            </tfoot>
          </table>
        ) : null}
        {doc.body ? <div className="dp-pre dp-body">{doc.body}</div> : null}
        {doc.notes ? (
          <section>
            <h2>{doc.kind === "quote" ? "Terms" : "Note"}</h2>
            <p className="dp-pre dp-small">{doc.notes}</p>
          </section>
        ) : null}
      </article>
    </div>
  );
}
