import { Container, ResultCard, Section } from "@/components/ui";
import { getDb } from "@jerryqiu/db";
import * as forms from "@jerryqiu/db/forms";
import { notFound } from "next/navigation";
import { QuestionnaireForm } from "@/components/QuestionnaireForm";
import { Shell } from "@/components/Shell";
import { resolveRef } from "@/lib/portal-links";

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
    <Shell cta={false}>
      <Section>
        <Container size="sm">
          {q.completedAt ? (
            <ResultCard eyebrow={q.title} title="Thank you" message="Your answers were sent." />
          ) : (
            <QuestionnaireForm token={token} title={q.title} fields={q.fields} />
          )}
        </Container>
      </Section>
    </Shell>
  );
}
