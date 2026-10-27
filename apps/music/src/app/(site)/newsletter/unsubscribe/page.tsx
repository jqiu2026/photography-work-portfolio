import { Button } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { unsubscribeAction } from "../actions";

export const metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function Unsubscribe({
  searchParams,
}: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const sp = await searchParams;
  async function go(form: FormData) {
    "use server";
    const { redirect } = await import("next/navigation");
    redirect((await unsubscribeAction(form)) ? "/newsletter/unsubscribe?done=1" : "/newsletter/unsubscribe?done=0");
  }
  return (
    <div>
      <PageHeader
        eyebrow="Newsletter"
        title={sp.done === "1" ? "You're unsubscribed" : sp.done === "0" ? "That link did not work" : "Unsubscribe"}
      />
      <div className="mu-wrap mu-section">
        {sp.done ? null : (
          <form action={go} className="mu-form">
            <input type="hidden" name="token" value={sp.token ?? ""} />
            <Button type="submit">Unsubscribe</Button>
          </form>
        )}
      </div>
    </div>
  );
}
