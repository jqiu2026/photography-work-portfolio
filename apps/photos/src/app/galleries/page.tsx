import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Marketing";

export const metadata: Metadata = {
  title: "Galleries",
  description: "How client galleries, proofing, downloads and photo protection work.",
};

export default function Galleries() {
  return (
    <Page
      title="Galleries"
      lede="Private galleries that are easy for clients and hard to copy casually. Honest about what protection can and cannot do."
    >
      <h2>For your clients</h2>
      <ul>
        <li>Open with a passcode, or sign in to a portal. Albums, a slideshow, and a welcome note.</li>
        <li>
          Favourite, rate (1 to 5), approve or pass on photographs, comment on any of them, and send a selection
          (optionally with a limit).
        </li>
        <li>Downloads in web size or full resolution, one at a time or as ZIP parts, behind an optional PIN.</li>
        <li>Galleries stay online for the period in your contract, then can be extended or brought back.</li>
      </ul>
      <h2>How photographs are protected</h2>
      <ul>
        <li>
          Originals are never shown on a page. Only smaller copies are delivered, each through a short-lived,
          single-purpose link.
        </li>
        <li>
          No photograph is a plain file on the page: the browser fetches each one with a token and displays it without a
          downloadable address. Right-click and drag are blocked, printing hides photographs, and capture shortcuts show
          a polite reminder.
        </li>
        <li>
          Client downloads carry an invisible mark that identifies the gallery session, so a leaked file can be traced.
        </li>
      </ul>
      <p>
        <strong>The honest limit:</strong> this deters casual copying and bulk scraping. It cannot stop a determined
        person who photographs or records their screen. The real protection is small previews, tracing, and asking for a
        licence.
      </p>
      <p>
        <Link href="/features">All features and statuses</Link> · <Link href="/terms">Terms for gallery access</Link>
      </p>
    </Page>
  );
}
