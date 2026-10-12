"use client";

import { ActionForm, ConfirmButton, F } from "./form-kit";
import { deleteSocial, saveSocial } from "@/app/(admin)/admin/profile/actions";

export const iconOptions = [
  "linkedin",
  "instagram",
  "youtube",
  "github",
  "x",
  "threads",
  "tiktok",
  "spotify",
  "soundcloud",
  "bandcamp",
  "applemusic",
  "flickr",
  "vimeo",
  "discord",
  "email",
  "web",
].map((v) => ({ value: v, label: v }));

type Link = {
  id: string;
  label: string;
  href: string;
  icon: string;
  sort: number;
  showHeader: boolean;
  showFooter: boolean;
  visible: boolean;
};

/** One editable account link (or the blank "add" row when `link` is undefined). */
export function SocialRow({ link }: { link: Link | undefined }) {
  return (
    <div className="adm-card">
      <ActionForm
        action={saveSocial}
        submitLabel={link ? "Save" : "Add link"}
        secondary={
          link ? (
            <ConfirmButton
              label="Delete"
              confirm={`Move “${link.label}” to the trash?`}
              action={() => deleteSocial(link.id)}
            />
          ) : undefined
        }
      >
        {link ? <F name="id" label="id" type="hidden" defaultValue={link.id} /> : null}
        <div className="adm-grid2">
          <F name="label" label="Label" defaultValue={link?.label} required />
          <F name="icon" label="Icon" type="select" options={iconOptions} defaultValue={link?.icon ?? "web"} />
        </div>
        <F
          name="href"
          label="URL"
          type="url"
          defaultValue={link?.href}
          required
          hint="https://…, or mailto:you@example.com"
        />
        <div className="adm-grid2">
          <F name="sort" label="Order" type="number" defaultValue={link?.sort ?? 0} min={0} />
          <div style={{ display: "grid", gap: "0.5rem", alignContent: "end" }}>
            <F name="visible" label="Visible" type="checkbox" defaultValue={link?.visible ?? true} />
            <F name="showFooter" label="Show in footer" type="checkbox" defaultValue={link?.showFooter ?? true} />
            <F name="showHeader" label="Show in header" type="checkbox" defaultValue={link?.showHeader ?? false} />
          </div>
        </div>
      </ActionForm>
    </div>
  );
}
