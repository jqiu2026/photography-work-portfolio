import Link from "next/link";

export const faq: { q: string; a: React.ReactNode; text: string }[] = [
  {
    q: "How do I book?",
    a: (
      <>
        Pick the kind of shoot on the <Link href="/book">booking page</Link>, or choose a free time on{" "}
        <Link href="/book/schedule">the scheduler</Link>. I reply by email.
      </>
    ),
    text: "Pick the kind of shoot on the booking page, or choose a free time on the scheduler. I reply by email.",
  },
  {
    q: "What does a package include?",
    a: (
      <>
        The <Link href="/packages">packages page</Link> lists coverage time, edited images and how long your gallery
        stays online. Mandatory fees are inside the price; optional extras are listed separately.
      </>
    ),
    text: "The packages page lists coverage time, edited images and how long your gallery stays online. Mandatory fees are inside the price; optional extras are listed separately.",
  },
  {
    q: "How much does it cost?",
    a: (
      <>
        Prices are being set and show as $XX until they are. Ask for a quote and you get every amount, with tax as its
        own line.
      </>
    ),
    text: "Prices are being set and show as $XX until they are. Ask for a quote and you get every amount, with tax as its own line.",
  },
  {
    q: "How do I pay?",
    a: <>Online by card, or by bank transfer when that is enabled, in one payment or instalments. You get a receipt.</>,
    text: "Online by card, or by bank transfer when that is enabled, in one payment or instalments. You get a receipt.",
  },
  {
    q: "How long is my gallery online?",
    a: (
      <>
        For the period in your contract. After that you can extend it or bring it back. See the{" "}
        <Link href="/terms">terms</Link>.
      </>
    ),
    text: "For the period in your contract. After that you can extend it or bring it back. See the terms.",
  },
  {
    q: "Can I download my photographs?",
    a: <>Yes, in web size or full resolution when your gallery allows it, one at a time or as ZIP parts.</>,
    text: "Yes, in web size or full resolution when your gallery allows it, one at a time or as ZIP parts.",
  },
  {
    q: "Why can't I right-click and save in the gallery?",
    a: <>Previews are protected so strangers cannot copy them casually. Use the download buttons for your own files.</>,
    text: "Previews are protected so strangers cannot copy them casually. Use the download buttons for your own files.",
  },
  {
    q: "Is this a finished product?",
    a: (
      <>
        Parts are live and parts are on the way. The <Link href="/features">features page</Link> marks each one Live,
        Preview or Soon.
      </>
    ),
    text: "Parts are live and parts are on the way. The features page marks each one Live, Preview or Soon.",
  },
];
