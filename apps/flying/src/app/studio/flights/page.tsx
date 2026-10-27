import * as fl from "@jerryqiu/db/flying";
import { removeFlightAction, saveFlightAction } from "@/app/studio/actions";
import { ActionForm } from "@/components/studio/ActionForm";
import { NoDb, StudioHead } from "@/components/studio/StudioBits";
import { Checkbox, Field, Input, Select } from "@/components/ui";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

export default async function Flights() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const [flights, airports] = await Promise.all([fl.listFlightsAdmin(db), fl.listAirports(db)]);
  const options = airports.map((a) => ({ value: a.code, label: `${a.code} ${a.name}` }));
  return (
    <>
      <StudioHead title="Flights" />
      <section className="st-card">
        <h2>Add a flight</h2>
        {airports.length ? (
          <ActionForm action={saveFlightAction} submit="Add flight" reset>
            <div className="st-grid2">
              <Field label="From">
                <Select name="from" defaultValue={airports[0].code} options={options} />
              </Field>
              <Field label="To">
                <Select name="to" defaultValue={airports[0].code} options={options} />
              </Field>
              <Field label="Day it landed" hint="Shown only as the month, and a week or more later.">
                <Input name="landedOn" type="date" required />
              </Field>
            </div>
            <div className="st-grid2">
              <Field label="Aircraft type" hint="The type only, like Cessna 172. Never a registration.">
                <Input name="aircraft" maxLength={60} />
              </Field>
              <Field label="Note (optional)">
                <Input name="note" maxLength={300} />
              </Field>
            </div>
            <Checkbox name="visible" defaultChecked label="Show it on the site (after the delay)" />
          </ActionForm>
        ) : (
          <p className="fl-muted">Add an airport first.</p>
        )}
      </section>
      <section className="st-card">
        <h2>Flights</h2>
        {flights.length ? (
          flights.map((f) => (
            <div key={f.id} className="st-rowline">
              <span>
                {f.fromCode} to {f.toCode} <span className="fl-mono">{f.landedOn}</span>{" "}
                <span className="fl-muted">
                  {[f.aircraftType, f.visible ? "" : "hidden"].filter(Boolean).join(" · ")}
                </span>
              </span>
              <ActionForm
                action={removeFlightAction}
                submit="Remove"
                variant="ghost"
                inline
                confirm="Remove this flight?"
              >
                <input type="hidden" name="id" value={f.id} />
              </ActionForm>
            </div>
          ))
        ) : (
          <p className="fl-muted">None yet.</p>
        )}
      </section>
    </>
  );
}
