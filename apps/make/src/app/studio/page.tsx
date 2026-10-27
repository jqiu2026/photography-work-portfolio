import * as mk from "@jerryqiu/db/make";
import Link from "next/link";
import { NoDb, Stat, StudioHead } from "@/components/studio/StudioBits";
import { Button } from "@/components/ui";
import { studioPage } from "@/lib/studio-page";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  const projects = await mk.listAdmin(db);
  const published = projects.filter((p) => p.published).length;
  const unchecked = projects.reduce((n, p) => n + p.unchecked, 0);
  return (
    <>
      <StudioHead title="Overview">
        <Button asChild>
          <Link href="/studio/projects/new">New project</Link>
        </Button>
      </StudioHead>
      <div className="st-stats">
        <Stat
          label="Published"
          value={`${published} of ${mk.SHOWCASE_MAX}`}
          hint={`Aim for ${mk.SHOWCASE_MIN} to ${mk.SHOWCASE_MAX}`}
        />
        <Stat label="Drafts" value={projects.length - published} />
        <Stat label="Screenshots to check" value={unchecked} hint="Hidden until checked" />
      </div>
      {published < mk.SHOWCASE_MIN ? (
        <p className="mk-note">
          The showcase works best with {mk.SHOWCASE_MIN} to {mk.SHOWCASE_MAX} projects. Publish{" "}
          {mk.SHOWCASE_MIN - published} more.
        </p>
      ) : null}
    </>
  );
}
