import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui";
import { verifyAction } from "../actions";

export const metadata = { title: "Sign in", robots: { index: false } };

/** A button, not a link that acts on its own: mail scanners open links, and must not use up a one-time link. */
export default async function Verify({ searchParams }: { searchParams: Promise<{ token?: string; failed?: string }> }) {
  const sp = await searchParams;
  return (
    <div>
      <PageHeader
        eyebrow="Scores"
        title={sp.failed ? "That link did not work" : "Open your library"}
        intro={sp.failed ? "It may have been used or expired. Ask for a new one." : undefined}
      />
      <div className="mu-wrap mu-section">
        {sp.failed ? (
          <Button asChild>
            <a href="/library">Ask for a new link</a>
          </Button>
        ) : (
          <form action={verifyAction} className="mu-form">
            <input type="hidden" name="token" value={sp.token ?? ""} />
            <Button type="submit">Open my library</Button>
          </form>
        )}
      </div>
    </div>
  );
}
