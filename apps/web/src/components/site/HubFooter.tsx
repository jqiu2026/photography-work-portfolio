import { Settle } from "@halation/ui/stage";
import NextLink from "next/link";

const legal = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Licensing", href: "/licensing" },
  { label: "Accessibility", href: "/accessibility" },
];

/** The hub footer: the only footer that lists the three worlds (the hub introduces them). */
export function Footer({
  person,
  socials,
  worlds,
}: {
  person: { name: string };
  socials: { label: string; href: string }[];
  worlds: { label: string; href: string }[];
}) {
  return (
    <footer className="hub-footer">
      <div className="hub-footer__in">
        <nav aria-label="The three rooms">
          <ul>
            {worlds.map((w) => (
              <li key={w.label}>
                <a href={w.href}>{w.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <ul aria-label="Elsewhere">
          {socials.map((s) => (
            <li key={s.label}>
              <a href={s.href}>{s.label}</a>
            </li>
          ))}
        </ul>
        <Settle as="p" className="hub-footer__note">
          © {new Date().getFullYear()} {person.name}. All photographs and writing are © {person.name} unless stated.
        </Settle>
        <nav aria-label="Legal">
          <ul>
            {legal.map((l) => (
              <li key={l.label}>
                <NextLink href={l.href}>{l.label}</NextLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
