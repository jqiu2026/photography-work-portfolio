import { NoDb, StudioHead } from "@/components/studio/StudioBits";
import { WorkForm } from "@/components/studio/WorkForm";
import { studioPage } from "@/lib/studio-page";

export default async function NewPiece() {
  const { db } = await studioPage();
  if (!db) return <NoDb />;
  return (
    <>
      <StudioHead title="New piece" />
      <section className="st-card">
        <WorkForm />
      </section>
    </>
  );
}
