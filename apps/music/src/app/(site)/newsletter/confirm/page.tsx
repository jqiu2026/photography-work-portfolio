import { Button } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { confirmAction } from "../actions";

export const metadata = { title: "Confirm subscription", robots: { index: false } };

/** A button, not a link that acts on its own: mail scanners open links, and must not subscribe anyone. */
export default async function Confirm({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const { token = "" } = await searchParams;
  async function go(form: FormData) {
    "use server";
    const { redirect } = await import("next/navigation");
    redirect((await confirmAction(form)) ? "/newsletter/confirm?done=1" : "/newsletter/confirm?done=0");
  }
  const sp = await searchParams;
  return (
    <main id="main">
      <PageHeader
        eyebrow="Newsletter"
        title={
          sp.done === "1"
            ? "You're subscribed"
            : sp.done === "0"
              ? "That link did not work"
              : "Confirm your subscription"
        }
      />
      <div className="mu-wrap mu-section">
        {sp.done ? (
          <p className="mu-muted">
            {sp.done === "1"
              ? "Thank you. You will hear when new music is published."
              : "It may be old. Subscribe again from the newsletter page."}
          </p>
        ) : (
          <form action={go} className="mu-form">
            <input type="hidden" name="token" value={token} />
            <Button type="submit">Confirm</Button>
          </form>
        )}
      </div>
    </main>
  );
}
