"use client";

import { Button, Checkbox, Field, Input, SettingsSection, Text, Textarea } from "@holominimal/ui";

import type { GalleryStyle } from "@jerryqiu/db/gallery-security";

type Props = {
  sty: GalleryStyle;
  updSty: <K extends keyof GalleryStyle>(k: K, v: GalleryStyle[K]) => void;
  tracks: { id: string; title: string; artist: string }[];
  onSave: () => void;
  pending: boolean;
};

/**
 * The parts of a gallery's branding beyond type and layout: the cover page and rules note, colours, a banner across the top,
 * the About text and the music playlist. One Save at the bottom; the gallery shows each as soon as it is saved.
 */
export function GalleryBranding({ sty, updSty, tracks, onSave, pending }: Props) {
  const hex = (v: string, fallback: string) => (/^#[0-9a-f]{6}$/i.test(v) ? v : fallback);
  const colour = (k: "primary" | "secondary", label: string) => (
    <div className="hm-field gm-colour-field" role="group" aria-label={label}>
      <span className="hm-field-label">{label}</span>
      <span className="gm-colour">
        <input
          className="gm-swatch"
          type="color"
          aria-label={`Pick ${label.toLowerCase()}`}
          value={hex(sty[k], "#ffffff")}
          onChange={(e) => updSty(k, e.target.value)}
        />
        <Input
          aria-label={`${label} (hex, optional)`}
          placeholder="#cc3322"
          value={sty[k]}
          onChange={(e) => updSty(k, e.target.value)}
        />
      </span>
    </div>
  );
  const toggle = (id: string) =>
    updSty("playlist", sty.playlist.includes(id) ? sty.playlist.filter((x) => x !== id) : [...sty.playlist, id]);
  return (
    <>
      <SettingsSection title="Cover page and rules note" className="gm-block">
        <Text size="sm" tone="muted">
          Visitors first see the cover with a View Gallery button. The note below (rules, thanks) appears once per visit
          with a Continue button. Use **bold**, *italic*, [links](https://example.com) and lines starting with "- " for
          a list. Pasted HTML is converted.
        </Text>
        <div className="gm-fields">
          <Checkbox
            checked={sty.introPage}
            onChange={(e) => updSty("introPage", e.target.checked)}
            label="Open with the cover page"
          />
          <Field label="Note heading">
            <Input maxLength={60} value={sty.introHeadline} onChange={(e) => updSty("introHeadline", e.target.value)} />
          </Field>
          <Field label="Note (blank = none)" className="gm-wide">
            <Textarea
              rows={8}
              maxLength={3000}
              value={sty.introMessage}
              onChange={(e) => updSty("introMessage", e.target.value)}
            />
          </Field>
        </div>
      </SettingsSection>
      <SettingsSection title="Colours" className="gm-block">
        <div className="gm-fields">
          {colour("primary", "Primary colour")}
          {colour("secondary", "Link colour")}
        </div>
        <Text size="sm" tone="muted">
          The primary colour is used for buttons and the active tab. Leave blank for the theme's own.
        </Text>
      </SettingsSection>
      <SettingsSection title="Banner" className="gm-block">
        <div className="gm-fields">
          <Checkbox
            checked={sty.bannerEnabled}
            onChange={(e) => updSty("bannerEnabled", e.target.checked)}
            label="Show a banner across the top"
          />
          <Field label="Banner text" className="gm-wide">
            <Input maxLength={120} value={sty.bannerText} onChange={(e) => updSty("bannerText", e.target.value)} />
          </Field>
          <Field label="Link (optional, starts with https://)">
            <Input maxLength={300} value={sty.bannerLink} onChange={(e) => updSty("bannerLink", e.target.value)} />
          </Field>
          <Field label="Stops showing after (optional)">
            <Input type="date" value={sty.bannerExpires} onChange={(e) => updSty("bannerExpires", e.target.value)} />
          </Field>
        </div>
      </SettingsSection>
      <SettingsSection title="About tab" className="gm-block">
        <Field
          label="A few lines about you or the shoot (your contact details come from Settings, Brand)"
          className="gm-wide"
        >
          <Textarea
            rows={4}
            maxLength={1500}
            value={sty.aboutText}
            onChange={(e) => updSty("aboutText", e.target.value)}
          />
        </Field>
      </SettingsSection>
      <SettingsSection title="Music" className="gm-block">
        {tracks.length ? (
          <>
            <Text size="sm" tone="muted">
              Tracks play in order while a visitor looks around. Add tracks under Galleries, Music.
            </Text>
            <ul className="hm-data-list st-list">
              {tracks.map((t) => (
                <li className="hm-data-list-item" key={t.id}>
                  <Checkbox
                    checked={sty.playlist.includes(t.id)}
                    onChange={() => toggle(t.id)}
                    label={
                      <>
                        {t.title}
                        {t.artist ? <small> · {t.artist}</small> : null}
                      </>
                    }
                  />
                </li>
              ))}
            </ul>
            <Checkbox
              checked={sty.autoplay}
              onChange={(e) => updSty("autoplay", e.target.checked)}
              label="Start playing when the visitor opens the gallery"
            />
          </>
        ) : (
          <Text size="sm" tone="muted">
            No tracks yet. Add some under Galleries, Music, then pick them here.
          </Text>
        )}
      </SettingsSection>
      <Button disabled={pending} onClick={onSave}>
        Save branding
      </Button>
    </>
  );
}
