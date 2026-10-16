import { Container, Section } from "@halation/ui";
import { getDb } from "@jerryqiu/db";
import * as forms from "@jerryqiu/db/forms";
import { notFound } from "next/navigation";
import { QuestionnaireForm } from "@/components/QuestionnaireForm";
import { Shell } from "@/components/Shell";
import { resolveRef } from "@/lib/portal-links";
import "@/components/studio/studio.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "A few questions", robots: { index: false, follow: false } };

export default async function QuestionnairePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();
  const ref = await resolveRef(token, "questionnaire");
  if (!db || !ref) notFound();
  const q = await forms.questionnaireByToken(db, ref);
  if (!q) notFound();
  return (
    <Shell>
      <Section>
        <Container size="md">
          {q.completedAt ? (
            <section className="st-card">
              <h1 className="st-title">{q.title}</h1>
              <p role="status" className="st-note">
                Your answers were sent. Thank you.
              </p>
            </section>
          ) : (
            <QuestionnaireForm token={token} title={q.title} fields={q.fields} />
          )}
        </Container>
      </Section>
    </Shell>
  );
}
