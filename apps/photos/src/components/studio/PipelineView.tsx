"use client";

import { ArrowRightIcon, Badge, Button, Surface } from "@holominimal/ui";

import { advanceJobAction, convertBookingAction } from "@/app/studio/actions";
import { Frame, useAct } from "./StudioFrame";

const STEPS = ["inquiry", "booked", "shot", "editing", "delivered", "paid"] as const;
const LABEL: Record<(typeof STEPS)[number], string> = {
  inquiry: "Inquiry",
  booked: "Booked",
  shot: "Shot",
  editing: "Editing",
  delivered: "Delivered",
  paid: "Paid",
};
const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

export type PipelineData = {
  leads: { id: string; name: string; shootType: string | null; score: number; eventDate: string | null }[];
  jobs: { id: string; title: string; client: string; status: string; date: string | null; feeCents: number }[];
};

/** Kanban of the whole business: new leads, then the six job steps. Cards move forward with a button (keyboard friendly). */
export function PipelineView({ user, data }: { user: string; data: PipelineData }) {
  const { pending, note, act } = useAct();
  const money = (jobs: PipelineData["jobs"]) => usd(jobs.reduce((n, j) => n + j.feeCents, 0));
  return (
    <Frame section="pipeline" user={user} note={note}>
      <div className="st-board" role="list" aria-label="Pipeline">
        <section className="st-col" role="listitem" aria-labelledby="col-leads">
          <h2 id="col-leads">
            New leads <Badge tone="muted">{data.leads.length}</Badge>
          </h2>
          <ul>
            {data.leads.map((l) => (
              <Surface as="li" key={l.id} variant="outlined" padding="sm" className="st-cardlet" data-lead-id={l.id}>
                <strong>{l.name}</strong>
                <small>{[l.shootType, l.eventDate].filter(Boolean).join(" · ") || "No details yet"}</small>
                <Badge tone="accent">score {l.score}</Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={() => act(() => convertBookingAction(l.id))}
                >
                  Convert to client
                </Button>
              </Surface>
            ))}
          </ul>
        </section>
        {STEPS.map((step, i) => {
          const jobs = data.jobs.filter((j) => j.status === step);
          return (
            <section key={step} className="st-col" role="listitem" aria-labelledby={`col-${step}`}>
              <h2 id={`col-${step}`}>
                {LABEL[step]}{" "}
                <Badge tone="muted">
                  {jobs.length}
                  {jobs.length ? ` · ${money(jobs)}` : ""}
                </Badge>
              </h2>
              <ul>
                {jobs.map((j) => (
                  <Surface as="li" key={j.id} variant="outlined" padding="sm" className="st-cardlet" data-job-id={j.id}>
                    <strong>{j.title}</strong>
                    <small>{[j.client, j.date].filter(Boolean).join(" · ")}</small>
                    {j.feeCents ? <small>{usd(j.feeCents)}</small> : null}
                    {i < STEPS.length - 1 ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() => act(() => advanceJobAction(j.id))}
                        aria-label={`Move ${j.title} to ${LABEL[STEPS[i + 1]]}`}
                      >
                        {LABEL[STEPS[i + 1]]} <ArrowRightIcon />
                      </Button>
                    ) : null}
                  </Surface>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Frame>
  );
}
