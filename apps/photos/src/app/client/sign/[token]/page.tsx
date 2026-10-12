import { Container, Section } from "@halation/ui";
import { getDb } from "@jerryqiu/db";
import * as st from "@jerryqiu/db/studio";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { SignForm } from "@/components/studio/ClientForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign your contract", robots: { index: false, follow: false } };

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();
  if (!db || token.length > 80) notFound();
  const k = await st.contractByToken(db, token);
  if (!k) notFound();
  return (
    <Shell>
      <Section>
        <Container size="md">
          {k.status === "signed" ? (
            <section className="st-card">
              <h1 className="st-title">Signed</h1>
              <p className="st-note" role="status">
                This contract was signed by {k.signerName}.
              </p>
            </section>
          ) : (
            <SignForm token={token} body={k.body} title={k.title} />
          )}
        </Container>
      </Section>
    </Shell>
  );
}
