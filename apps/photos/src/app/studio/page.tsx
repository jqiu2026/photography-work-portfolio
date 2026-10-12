import { Container } from "@placeholder/ui";
import { Shell } from "@/components/Shell";
import { requirePageUser } from "@/auth";
import "../globals.css";

export const metadata = { title: "Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Studio() {
  const user = await requirePageUser("studio.access", "/studio");
  return (
    <Shell>
      <Container className="page-head">
        <p className="ph-eyebrow" style={{ marginBottom: "1rem" }}>
          Studio
        </p>
        <h1 className="ph-heading ph-heading--display">Hello, {user.name?.split(" ")[0] ?? "there"}</h1>
      </Container>
    </Shell>
  );
}
