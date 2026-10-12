import { getDb } from "@jerryqiu/db";
import { type ExtEvent, listCached, sourceFromEnv } from "@jerryqiu/shootproof";
import { mintAllWidths, tokenSecrets } from "@jerryqiu/protect";
import { Button, Container, Eyebrow, Heading, Section, Text } from "@placeholder/ui";
import { GuardScope, ProtectedGallery } from "@placeholder/ui/media";
import { Shell } from "@/components/Shell";
import { requirePageUser } from "@/auth";
import "../../globals.css";
import { connectedToken } from "./token";
import { disconnectAction, importAction, purgeExpiredAction, removeAction } from "./actions";

export const metadata = { title: "ShootProof", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type SP = { imported?: string; failed?: string; capped?: string; error?: string; connected?: string; purged?: string };

export default async function ShootProofPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requirePageUser("shootproof.manage", "/studio/shootproof");
  const sp = await searchParams;
  const state = sourceFromEnv();
  const db = getDb();

  return (
    <Shell>
      <Container className="page-head">
        <Eyebrow style={{ marginBottom: "1rem" }}>Studio</Eyebrow>
        <Heading as="h1" size="display" display>
          ShootProof
        </Heading>
        <Text tone="muted" style={{ marginTop: "1rem", maxWidth: "60ch" }}>
          A temporary bridge while client galleries still live on ShootProof. Pick an event and its photographs are
          copied here as small previews for a day. Originals are never kept. This goes away when Phase 3 replaces
          ShootProof.
        </Text>
      </Container>
      <Section style={{ paddingTop: 0 }}>
        <Container size="md">
          {sp.error ? (
            <p role="alert" className="studio-msg studio-msg--bad">
              {sp.error}
            </p>
          ) : null}
          {sp.connected ? (
            <p role="status" className="studio-msg">
              Connected.
            </p>
          ) : null}
          {sp.imported ? (
            <p role="status" className="studio-msg">
              Imported {sp.imported} photo{sp.imported === "1" ? "" : "s"}
              {Number(sp.failed) ? `, ${sp.failed} failed` : ""}
              {sp.capped ? ". Only the first 60 were imported." : "."}
            </p>
          ) : null}
          {sp.purged ? (
            <p role="status" className="studio-msg">
              Removed {sp.purged} expired photo(s).
            </p>
          ) : null}

          {state.state === "unconfigured" ? (
            <NotConnected />
          ) : db ? (
            await Connected({ mode: state.source.mode })
          ) : (
            <p>The database isn't set up.</p>
          )}
        </Container>
      </Section>
    </Shell>
  );
}

function NotConnected() {
  return (
    <div className="studio-card" data-testid="not-connected">
      <Heading as="h2" size="2xl">
        Not connected
      </Heading>
      <Text tone="muted" style={{ margin: "0.75rem 0" }}>
        ShootProof only gives an API client ID on request, so this is switched off until you have one. Nothing is
        contacted in the meantime.
      </Text>
      <ol className="studio-steps">
        <li>
          Email <strong>support@shootproof.com</strong> asking for a Studio API client ID. Include your name, a support
          email, the app name, a description (255 characters max), your website, a 500×500 avatar and the redirect URL
          below.
        </li>
        <li>
          Redirect URL to give them:{" "}
          <code>{`${process.env.NEXT_PUBLIC_PHOTOS_URL ?? "https://photos.jerryqiu.com"}/studio/shootproof/callback`}</code>
        </li>
        <li>
          Set <code>SHOOTPROOF_CLIENT_ID</code> in the photography project's environment and redeploy.
        </li>
        <li>Come back here and press Connect.</li>
      </ol>
      <Text tone="muted" size="sm">
        Details and what to check at the first live connection: <code>docs/shootproof-bridge.md</code>.
      </Text>
    </div>
  );
}

async function Connected({ mode }: { mode: "live" | "mock" }) {
  const db = getDb();
  if (!db) return null;
  const token = await connectedToken();
  const cached = await listCached(db);
  const secrets = tokenSecrets();
  let events: ExtEvent[] = [];
  let listError = "";
  const state = sourceFromEnv();
  if (token && state.state === "ready") {
    try {
      events = await state.source.listEvents(token);
    } catch (error) {
      console.error("[shootproof] could not list events", String(error));
      listError = "Could not load your events from ShootProof. Try again, or reconnect.";
    }
  }
  return (
    <>
      {mode === "mock" ? (
        <p className="studio-msg" data-testid="mock-banner">
          Sample mode: fixtures are shown, nothing is fetched from ShootProof.
        </p>
      ) : null}
      {!token ? (
        <div className="studio-card" data-testid="not-authorized">
          <Heading as="h2" size="2xl">
            Not connected
          </Heading>
          <Text tone="muted" style={{ margin: "0.75rem 0" }}>
            Allow this site to read your ShootProof events. You can disconnect at any time.
          </Text>
          <Button as="a" href="/studio/shootproof/connect">
            Connect ShootProof
          </Button>
        </div>
      ) : (
        <>
          <div className="studio-card">
            <Heading as="h2" size="2xl">
              Events
            </Heading>
            {listError ? (
              <p role="alert" className="studio-msg studio-msg--bad">
                {listError}
              </p>
            ) : null}
            <ul className="studio-list">
              {events.map((e) => (
                <li key={`${e.brandId}-${e.id}`}>
                  <span>
                    <strong>{e.name}</strong>
                    <span className="studio-note">
                      {" "}
                      {e.photosCount} photo{e.photosCount === 1 ? "" : "s"}
                      {e.date ? ` · ${e.date}` : ""}
                    </span>
                  </span>
                  <form action={importAction}>
                    <input type="hidden" name="brandId" value={e.brandId} />
                    <input type="hidden" name="eventId" value={e.id} />
                    <Button type="submit" size="sm" aria-label={`Import ${e.name}`}>
                      Import for 24 hours
                    </Button>
                  </form>
                </li>
              ))}
              {!events.length && !listError ? <li className="studio-note">No events found.</li> : null}
            </ul>
            <form action={disconnectAction} style={{ marginTop: "1rem" }}>
              <Button type="submit" variant="ghost" size="sm">
                Disconnect
              </Button>
            </form>
          </div>

          <div className="studio-card" style={{ marginTop: "1.5rem" }}>
            <Heading as="h2" size="2xl">
              Imported ({cached.length})
            </Heading>
            <Text tone="muted" size="sm">
              Each photo disappears 24 hours after it was imported.
            </Text>
            {cached.length ? (
              <>
                <GuardScope level="strict" />
                <div data-testid="imported" style={{ marginTop: "1rem" }}>
                  <ProtectedGallery
                    base="/api/ext"
                    items={cached.map((c) => ({
                      asset: { id: c.id, width: c.width ?? 1600, height: c.height ?? 1067, files: [] },
                      alt: c.title ?? "Imported photograph",
                      tokens: mintAllWidths({ id: c.id, secrets }),
                    }))}
                  />
                </div>
                <ul className="studio-list">
                  {cached.map((c) => (
                    <li key={c.id}>
                      <span>
                        {c.title}{" "}
                        <span className="studio-note">
                          expires {c.expiresAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                        </span>
                      </span>
                      <form action={removeAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <Button type="submit" size="sm" variant="ghost" aria-label={`Remove ${c.title}`}>
                          Remove
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="studio-note">Nothing imported.</p>
            )}
            <form action={purgeExpiredAction} style={{ marginTop: "1rem" }}>
              <Button type="submit" size="sm" variant="ghost">
                Clear expired now
              </Button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
