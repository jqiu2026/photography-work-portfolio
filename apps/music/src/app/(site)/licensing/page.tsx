import { COMMON_TERMS, TIERS } from "@jerryqiu/scores";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Score licenses", description: "What each score license allows." };

export default function Licensing() {
  return (
    <div>
      <PageHeader
        eyebrow="Legal"
        title="Score licenses"
        intro="Buying a score buys a license to use it, not the copyright. There are three kinds."
      />
      <div className="mu-wrap mu-section">
        {/* TODO(owner): this wording is a draft; a lawyer should review it before real sales (Q13, Q129). */}
        <div className="hm-prose">
          {(Object.keys(TIERS) as (keyof typeof TIERS)[]).map((t) => (
            <section key={t}>
              <h2>{TIERS[t].label}</h2>
              <p>{TIERS[t].summary}</p>
              <ul>
                {TIERS[t].terms.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
          ))}
          <h2>For every license</h2>
          <ul>
            {COMMON_TERMS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <h2>Arrangements of other people's music</h2>
          <p>
            An arrangement of a copyrighted work is only sold once the arranging license from the rights holder is on
            file. Until then it is not for sale. Arrangements of public-domain works are labeled as such.
          </p>
          <h2>Refunds</h2>
          <p>
            Scores are digital and made for you, so they are not refundable once downloaded, except when the file is
            wrong or damaged. If you were charged and could not get your files, write and it will be fixed or refunded.
            A refund ends the license.
          </p>
        </div>
      </div>
    </div>
  );
}
