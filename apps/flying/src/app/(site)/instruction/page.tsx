import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getFlyingContent } from "@/lib/interests";
import { siteSettings } from "@/lib/site-settings";

export const metadata = { title: "Instruction" };
export const dynamic = "force-dynamic";

/**
 * Hidden by default (Q36): a quiet slot for possible CFI services. It renders only when the owner switches it on
 * (setting flying.instruction.enabled, or FLYING_INSTRUCTION=on for local demos); otherwise it is a 404 and is not
 * linked or listed anywhere. Inquiry only: no booking, no payment, no claims.
 */
export default async function Instruction() {
  const settings = (await siteSettings("flying")) as unknown as { instruction?: { enabled?: boolean } };
  const on = process.env.FLYING_INSTRUCTION === "on" || settings.instruction?.enabled === true;
  if (!on) notFound();
  const flying = await getFlyingContent();
  return (
    <div>
      {/* TODO(owner): if you offer instruction, say so in your own words and with your real credentials. */}
      <PageHeader
        eyebrow="Flying"
        title="Instruction"
        intro="TODO(owner): if you offer instruction, say so in your own words and with your real credentials."
      />
      <div className="fl-wrap fl-section">
        <p className="fl-muted">{flying.disclaimer}</p>
      </div>
    </div>
  );
}
