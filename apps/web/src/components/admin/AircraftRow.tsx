"use client";

import { deleteAircraft, saveAircraft } from "@/app/(admin)/admin/flying/actions";
import { ActionForm, ConfirmButton, F } from "./form-kit";

type Row = { id: string; name: string; note: string | null; flown: boolean; visible: boolean; sort: number };

/** One aircraft (or the blank add row). */
export function AircraftRow({ row }: { row: Row | undefined }) {
  return (
    <div className="adm-card">
      <ActionForm
        action={saveAircraft}
        submitLabel={row ? "Save" : "Add aircraft"}
        secondary={
          row ? (
            <ConfirmButton
              label="Delete"
              confirm={`Move “${row.name}” to the trash?`}
              action={deleteAircraft.bind(null, row.id)}
            />
          ) : undefined
        }
      >
        {row ? <F name="id" label="id" type="hidden" defaultValue={row.id} /> : null}
        <div className="adm-grid2">
          <F name="name" label="Aircraft" defaultValue={row?.name} required placeholder="e.g. Cessna 172" />
          <F name="sort" label="Order" type="number" defaultValue={row?.sort ?? 0} min={0} />
        </div>
        <F name="note" label="Note" defaultValue={row?.note} />
        <div className="adm-grid2">
          <F name="flown" label="I have flown it" type="checkbox" defaultValue={row?.flown ?? true} />
          <F name="visible" label="Visible" type="checkbox" defaultValue={row?.visible ?? true} />
        </div>
      </ActionForm>
    </div>
  );
}
