import { schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import NextLink from "next/link";
import { requirePageUser } from "@/auth";
import { ActionForm, F } from "@/components/admin/form-kit";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { adminSites } from "@/components/admin/nav";
import { getAdminSite } from "@/components/admin/site";
import { NoDb, PageHead } from "@/components/admin/ui";
import { withDb } from "@/lib/admin-db";
import { navToLines, readSetting } from "@jerryqiu/db/settings";
import { saveSettings } from "./actions";

export const metadata = { title: "Pages & settings" };

const LEGAL = [
  { slug: "privacy", label: "Privacy policy" },
  { slug: "terms", label: "Terms of use" },
  { slug: "licensing", label: "Licensing" },
  { slug: "accessibility", label: "Accessibility statement" },
];

function Group({
  site,
  k,
  title,
  help,
  children,
}: { site: string; k: string; title: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="adm-card" aria-labelledby={`g-${k}`} style={{ marginBottom: "1.5rem" }}>
      <h2 id={`g-${k}`} style={{ fontSize: "var(--hl-text-xl)" }}>
        {title}
      </h2>
      {help ? <p className="adm-note">{help}</p> : null}
      <ActionForm action={saveSettings}>
        <F name="site" label="site" type="hidden" defaultValue={site} />
        <F name="key" label="key" type="hidden" defaultValue={k} />
        {children}
      </ActionForm>
    </section>
  );
}

export default async function SettingsPage() {
  await requirePageUser("settings.write", "/admin/settings");
  const site = await getAdminSite();
  const data = await withDb(async (db) => {
    const rows = await db.select().from(schema.settings).where(eq(schema.settings.site, site));
    const by = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const legal = site === "hub" ? await db.select().from(schema.pages).where(eq(schema.pages.kind, "legal")) : [];
    return { by, legal };
  });
  if (!data) return <NoDb />;
  const general = readSetting("general", data.by.general);
  const home = readSetting("home", data.by.home);
  const seo = readSetting("seo", data.by.seo);
  const theme = readSetting("theme", data.by.theme);
  const prot = readSetting("protection", data.by.protection);
  const nav = readSetting("nav", data.by.nav);
  const label = adminSites.find((s) => s.id === site)?.label;
  return (
    <>
      <PageHead
        title="Pages & settings"
        lede={`Settings for the ${label} site. Switch sites with the selector at the top of the sidebar. Changes appear on the public site within seconds.`}
      />
      <Group
        site={site}
        k="general"
        title="General"
        help="Maintenance mode shows visitors a short notice instead of the site. You can still sign in to the admin."
      >
        <div className="adm-grid2">
          <F name="siteName" label="Site name" defaultValue={general.siteName} />
          <F name="tagline" label="Tagline" defaultValue={general.tagline} />
        </div>
        <F
          name="contactEmail"
          label="Contact email shown on the site"
          type="email"
          defaultValue={general.contactEmail}
        />
        <F name="maintenance" label="Maintenance mode" type="checkbox" defaultValue={general.maintenance} />
        <F
          name="maintenanceMessage"
          label="Maintenance message"
          type="textarea"
          rows={2}
          defaultValue={general.maintenanceMessage}
        />
      </Group>
      <Group site={site} k="home" title="Home and about copy" help="Leave a field empty to keep the built-in text.">
        <F name="heroHeadline" label="Home headline" defaultValue={home.heroHeadline} />
        <F name="heroIntro" label="Home intro" type="textarea" rows={3} defaultValue={home.heroIntro} />
        <F name="aboutIntro" label="About intro" type="textarea" rows={4} defaultValue={home.aboutIntro} />
      </Group>
      <Group
        site={site}
        k="seo"
        title="Search and sharing"
        help="Defaults for pages that do not set their own title and description."
      >
        <F name="title" label="Default title" defaultValue={seo.title} hint="Up to 70 characters." />
        <F
          name="description"
          label="Default description"
          type="textarea"
          rows={2}
          defaultValue={seo.description}
          hint="Up to 170 characters."
        />
        <MediaPicker name="ogImageMediaId" label="Default share image" defaultValue={seo.ogImageMediaId || undefined} />
      </Group>
      <Group
        site={site}
        k="theme"
        title="Accent colour"
        help="One small accent per site. Everything else stays neutral."
      >
        <F
          name="accent"
          label="Accent"
          type="select"
          defaultValue={theme.accent}
          options={[
            { value: "default", label: "Site default" },
            { value: "blue", label: "Blue" },
            { value: "red", label: "Red" },
            { value: "yellow", label: "Yellow" },
            { value: "green", label: "Green" },
          ]}
        />
      </Group>
      <Group
        site={site}
        k="protection"
        title="Image protection"
        help="A deterrent, not a lock. It makes casual saving harder, but it cannot stop screenshots taken by the operating system or a phone camera. Galleries can override this."
      >
        <F
          name="level"
          label="Default level"
          type="select"
          defaultValue={prot.level}
          options={[
            { value: "off", label: "Off" },
            { value: "light", label: "Light: no right-click or drag" },
            { value: "strict", label: "Strict: also warns on screenshot and save shortcuts" },
          ]}
        />
        <F name="watermark" label="Add a visible watermark to images" type="checkbox" defaultValue={prot.watermark} />
        <div className="adm-grid2">
          <F name="watermarkText" label="Watermark text" defaultValue={prot.watermarkText} placeholder="© Jerry Qiu" />
          <F
            name="watermarkPosition"
            label="Position"
            type="select"
            defaultValue={prot.watermarkPosition}
            options={[
              { value: "bottom-right", label: "Bottom right" },
              { value: "bottom-left", label: "Bottom left" },
              { value: "center", label: "Centre" },
            ]}
          />
        </div>
        <F
          name="watermarkOpacity"
          label="Watermark opacity (0.05 to 0.8)"
          type="number"
          defaultValue={prot.watermarkOpacity}
          min={0.05}
          max={0.8}
        />
      </Group>
      <Group
        site={site}
        k="nav"
        title="Navigation"
        help="One link per line as “Label | /path”. Leave empty to use the built-in navigation."
      >
        <F name="items" label="Links" type="textarea" rows={6} defaultValue={navToLines(nav.items)} />
      </Group>
      <section className="adm-card" aria-labelledby="g-backup" style={{ marginBottom: "1.5rem" }}>
        <h2 id="g-backup" style={{ fontSize: "var(--hl-text-xl)" }}>
          Export and backup
        </h2>
        <p className="adm-note">
          A zip with every post, page, project, gallery and setting as JSON and Markdown, plus a manifest of your
          images. It contains visitors' messages, so keep it private. From a terminal, <code>pnpm db:backup</code> does
          the same.
        </p>
        <a href="/api/admin/export" download style={{ textDecoration: "underline" }}>
          Download a full export
        </a>
      </section>
      {site === "hub" ? (
        <section className="adm-card" aria-labelledby="g-legal">
          <h2 id="g-legal" style={{ fontSize: "var(--hl-text-xl)" }}>
            Legal pages
          </h2>
          <p className="adm-note">
            Drafts until you publish. Until a page is published here, the site shows its built-in draft text, which is
            marked for review. Have a lawyer read these before relying on them.
          </p>
          <table className="adm-table">
            <tbody>
              {LEGAL.map((l) => {
                const row = data.legal.find((p) => p.slug === l.slug);
                return (
                  <tr key={l.slug}>
                    <td>
                      <NextLink href={`/admin/settings/legal/${l.slug}`}>{l.label}</NextLink>
                    </td>
                    <td>{row ? row.status : "built-in draft"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}
    </>
  );
}
