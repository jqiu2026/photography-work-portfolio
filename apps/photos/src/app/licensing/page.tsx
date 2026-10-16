import { person } from "@jerryqiu/sites/profile";
import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Marketing";

export const metadata: Metadata = { title: "Licensing", description: "Using a photograph." };

export default function Licensing() {
  return (
    <Page title="Licensing" lede="All photographs here are © Jerry Qiu, all rights reserved, unless stated.">
      {/* TODO(owner, lawyer): review. */}
      <p>
        Please do not use a photograph without permission. To license one,{" "}
        <Link href="/book/licensing">send a request</Link> with the photograph, where it will appear and for how long,
        or write to <a href={`mailto:${person.bookingEmail}`}>{person.bookingEmail}</a>. Licences are written down, name
        the use and the term, and are tracked.
      </p>
      <p>
        Pages ask AI crawlers not to use these photographs (robots rules and <code>noai</code> tags). That is a request,
        not enforcement.
      </p>
      <p>Seen a photograph used without permission? Tell me and I will follow up.</p>
    </Page>
  );
}
