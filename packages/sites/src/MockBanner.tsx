import { MOCK_BANNER } from "@jerryqiu/mocks";

/** Persistent label on every local mock: it is not a real service, it only lives in this browser. */
export function MockBanner({ what }: { what?: string }) {
  return (
    <aside className="hl-mock-banner" role="note" aria-label="Mock notice">
      <strong>MOCK</strong>
      <span>
        {what ? `${what}. ` : ""}
        {MOCK_BANNER.replace(/^MOCK · /, "")}
      </span>
    </aside>
  );
}
