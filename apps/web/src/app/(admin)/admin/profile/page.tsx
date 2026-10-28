import { schema } from "@jerryqiu/db";
import { and, asc, eq, isNull } from "drizzle-orm";
import { ActionForm, F } from "@/components/admin/form-kit";
import { NoDb, PageHead } from "@/components/admin/ui";
import { SocialRow } from "@/components/admin/SocialRow";
import { withDb } from "@/lib/admin-db";
import { saveProfile, saveSocial } from "./actions";

export const metadata = { title: "Profile & links" };

type Profile = {
  name?: string;
  headline?: string;
  location?: string;
  currently?: string;
  email?: string;
  bookingEmail?: string;
  languages?: string[];
  skills?: string[];
};

export default async function ProfilePage() {
  const data = await withDb(async (db) => {
    const [row] = await db
      .select()
      .from(schema.settings)
      .where(and(eq(schema.settings.site, "hub"), eq(schema.settings.key, "profile")))
      .limit(1);
    const links = await db
      .select()
      .from(schema.socialLinks)
      .where(isNull(schema.socialLinks.deletedAt))
      .orderBy(asc(schema.socialLinks.sort));
    return { profile: (row?.value ?? {}) as Profile, links };
  });
  if (!data) return <NoDb />;
  const p = data.profile;
  return (
    <>
      <PageHead
        title="Profile & links"
        lede="The headline, the “currently” line, contact details, skills and your account links. Shown on the hub home, About and Connect pages, and in the footer. Empty fields stay hidden."
      />
      <ActionForm action={saveProfile}>
        <div className="adm-grid2">
          <F name="name" label="Name" defaultValue={p.name} required />
          <F name="location" label="Location" defaultValue={p.location} />
        </div>
        <F
          name="headline"
          label="Headline"
          defaultValue={p.headline}
          hint="One plain sentence in your own voice. No superlatives."
        />
        <F
          name="currently"
          label="Currently"
          defaultValue={p.currently}
          hint="What you are up to right now. Leave empty to hide the line."
        />
        <div className="adm-grid2">
          <F name="email" label="Email" type="email" defaultValue={p.email} required />
          <F name="bookingEmail" label="Bookings email" type="email" defaultValue={p.bookingEmail} />
        </div>
        <F name="languages" label="Languages" defaultValue={(p.languages ?? []).join(", ")} hint="Comma separated." />
        <F
          name="skills"
          label="Skills & interests"
          defaultValue={(p.skills ?? []).join(", ")}
          hint="Comma separated tags."
        />
      </ActionForm>

      <h2 style={{ margin: "3rem 0 0.5rem", fontSize: "var(--hm-text-2xl)", letterSpacing: "-0.03em" }}>
        Account links
      </h2>
      <p className="adm-note" style={{ marginBottom: "1rem" }}>
        Shown on the home page profile, the footer and Connect. They carry rel=me and feed the Person structured data.
      </p>
      <div style={{ display: "grid", gap: "1rem" }}>
        {data.links.map((l) => (
          <SocialRow key={l.id} link={l} />
        ))}
        <SocialRow link={undefined} />
      </div>
    </>
  );
}
