import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <Shell>
      <PageHeader eyebrow="404" title="Not found" intro="That page doesn't exist, or it moved.">
        <div className="pub-actions" style={{ marginTop: "var(--hm-space-6)" }}>
          <Button asChild size="lg">
            <Link href="/portfolio">See the portfolio</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
      </PageHeader>
    </Shell>
  );
}
