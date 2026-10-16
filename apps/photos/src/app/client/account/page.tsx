import Link from "next/link";
import { PasswordForm, PrefsForm } from "@/components/portal/PortalForms";
import { PortalFrame } from "@/components/portal/PortalFrame";
import { requireAccount } from "@/lib/portal-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account", robots: { index: false, follow: false } };

export default async function PortalAccount({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const { me, unread } = await requireAccount();
  return (
    <PortalFrame current="account" name={me.client.name} unread={unread}>
      {welcome ? (
        <p role="status" className="st-note">
          Welcome. Choose a password below so you can sign in without an emailed link next time (you can always use a
          link too).
        </p>
      ) : null}
      <div className="st-grid">
        <section className="st-card" aria-labelledby="a-pw">
          <h2 id="a-pw">Password</h2>
          <p className="st-note">Signed in as {me.account.email}.</p>
          <PasswordForm hasPassword={Boolean(me.account.passwordHash)} />
        </section>
        <section className="st-card" aria-labelledby="a-pref">
          <h2 id="a-pref">Emails</h2>
          <PrefsForm prefs={me.account.prefs} />
        </section>
        <section className="st-card" aria-labelledby="a-data">
          <h2 id="a-data">Your data</h2>
          <p className="st-note">
            See the <Link href="/privacy">privacy page</Link>. To export or delete everything I hold about you, send me
            a message and I will do it.
          </p>
        </section>
      </div>
    </PortalFrame>
  );
}
