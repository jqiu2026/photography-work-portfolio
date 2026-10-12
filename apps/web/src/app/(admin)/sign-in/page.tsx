import { Button, Container, Heading, Text } from "@placeholder/ui";
import { safeCallback } from "@jerryqiu/auth/policy";
import { getSites } from "@jerryqiu/sites";
import { redirect } from "next/navigation";
import { currentUser, kit, signIn } from "@/auth";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  AccessDenied:
    "That Google account isn't authorized. Sign in with your @jerryqiu.com account, and ask the owner to add you if you should have access.",
  Configuration: "Google sign-in isn't set up yet. See docs/google-oauth-setup.md.",
  Verification: "That sign-in link expired. Try again.",
};

export default async function SignIn({
  searchParams,
}: { searchParams: Promise<{ error?: string; callbackUrl?: string }> }) {
  const sp = await searchParams;
  const origins = getSites().map((s) => new URL(s.url).origin);
  const callback = safeCallback(sp.callbackUrl, "/admin", origins);
  if (await currentUser()) redirect(callback);
  const configured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  async function google() {
    "use server";
    await signIn("google", { redirectTo: callback });
  }

  return (
    <Container size="sm" style={{ paddingBlock: "clamp(4rem, 14vh, 9rem)" }}>
      <p className="ph-eyebrow" style={{ marginBottom: "1.25rem" }}>
        Admin
      </p>
      <Heading as="h1" size="4xl" display>
        Sign in
      </Heading>
      <Text tone="muted" size="lg" style={{ margin: "1.25rem 0 2rem" }}>
        Only @{kit.domain} accounts on the allow-list can sign in.
      </Text>
      {sp.error ? (
        <p role="alert" style={{ color: "var(--ph-danger)", marginBottom: "1.5rem" }}>
          {errors[sp.error] ?? "Sign-in failed. Try again."}
        </p>
      ) : null}
      <form action={google}>
        <Button type="submit" size="lg" disabled={!configured}>
          Sign in with Google
        </Button>
      </form>
      {!configured ? (
        <Text tone="muted" size="sm" style={{ marginTop: "1rem" }}>
          Google credentials are not set (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET). See docs/google-oauth-setup.md.
        </Text>
      ) : null}
      {kit.isOpenSignIn ? (
        <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--ph-line)" }}>
          <Text size="sm" tone="muted">
            Development only: open sign-in is on (DASHBOARD_OPEN_SIGNIN). Production builds ignore it.
          </Text>
          <div style={{ marginTop: "1rem" }}>
            <Button as="a" href={callback} variant="ghost">
              Continue as local developer
            </Button>
          </div>
        </div>
      ) : null}
    </Container>
  );
}
