import * as fl from "@jerryqiu/db/flying";
import { removeAirportAction, saveAirportAction } from "@/app/studio/actions";
import { ActionForm } from "@/components/studio/ActionForm";
import { NoDb, StudioHead } from "@/components/studio/StudioBits";
import { Field, Input } from "@/components/ui";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

export default async function Airports() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const list = await fl.listAirports(db);
  return (
    <>
      <StudioHead title="Airports" />
      <section className="st-card">
        <h2>Add an airport</h2>
        <p className="fl-muted">
          Look up the code and the coordinates of the airport (decimal degrees, west and south are negative).
        </p>
        <ActionForm action={saveAirportAction} submit="Add airport" reset>
          <div className="st-grid2">
            <Field label="Code" hint="Like KBOS.">
              <Input name="code" required maxLength={4} autoCapitalize="characters" />
            </Field>
            <Field label="Name">
              <Input name="name" required maxLength={120} />
            </Field>
            <Field label="Latitude">
              <Input name="lat" inputMode="decimal" required />
            </Field>
            <Field label="Longitude">
              <Input name="lon" inputMode="decimal" required />
            </Field>
          </div>
        </ActionForm>
      </section>
      <section className="st-card">
        <h2>Airports</h2>
        {list.length ? (
          list.map((a) => (
            <div key={a.id} className="st-rowline">
              <span>
                <strong>{a.code}</strong> {a.name}{" "}
                <span className="fl-mono">
                  {a.lat}, {a.lon}
                </span>
              </span>
              <ActionForm
                action={removeAirportAction}
                submit="Remove"
                variant="ghost"
                inline
                confirm={`Remove ${a.code}?`}
              >
                <input type="hidden" name="id" value={a.id} />
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
