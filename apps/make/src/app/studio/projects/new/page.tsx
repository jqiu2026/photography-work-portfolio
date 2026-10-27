import { NoDb, StudioHead } from "@/components/studio/StudioBits";
import { ProjectForm } from "@/components/studio/ProjectForm";
import { studioPage } from "@/lib/studio-page";

export default async function NewProject() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  return (
    <>
      <StudioHead title="New project" />
      <section className="st-card">
        <ProjectForm />
      </section>
    </>
  );
}
