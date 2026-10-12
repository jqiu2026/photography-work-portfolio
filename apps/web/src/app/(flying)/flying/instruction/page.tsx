import { notFound } from "next/navigation";
import { InterestShell } from "@/components/interest/InterestShell";
import { PageHeader } from "@/components/site/PageHeader";
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
    <InterestShell id="flying">
      <PageHeader
        eyebrow="Flying"
        title="Instruction"
        intro="TODO(owner): if you offer instruction, say so in your own words and with your real credentials."
      />
      <p
        style={{
          width: "min(100% - 2 * var(--hl-gutter), var(--hl-container-md))",
          marginInline: "auto",
          color: "var(--hl-muted)",
        }}
      >
        {flying.disclaimer}
      </p>
    </InterestShell>
  );
}
