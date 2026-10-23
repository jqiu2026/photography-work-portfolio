import { Avatar, Card, CardContent, CardFooter } from "@holominimal/ui";
import type { ReactNode } from "react";

/**
 * A client's words in a card: a large quote mark, the quote, then who said it. Holominimal has no quote component, so
 * this is its Card with an Avatar (initials) in the footer. `meta` is for a badge or a note beside the name.
 */
export function QuoteCard({
  quote,
  name,
  role,
  meta,
  className,
}: { quote: string; name: string; role?: string | null; meta?: ReactNode; className?: string }) {
  return (
    <Card variant="outlined" className={["qc", className].filter(Boolean).join(" ")}>
      <CardContent>
        <figure className="qc-fig">
          <span className="qc-mark" aria-hidden="true">
            “
          </span>
          <blockquote className="qc-text">{quote}</blockquote>
          <CardFooter>
            <figcaption className="qc-by">
              <Avatar name={name} size="sm" />
              <span>
                <b>{name}</b>
                {role ? <small>{role}</small> : null}
              </span>
              {meta ? <span className="qc-meta">{meta}</span> : null}
            </figcaption>
          </CardFooter>
        </figure>
      </CardContent>
    </Card>
  );
}
