import type { Metadata } from "next";
import Link from "next/link";
import { Page, Sample } from "@/components/Marketing";

export const metadata: Metadata = {
  title: "How a gallery works",
  description: "What a client sees when their gallery arrives.",
};

export default function HowAGalleryWorks() {
  return (
    <Page
      title="How a gallery works"
      lede="No account to make. Your photographer sends a link; that one page is your gallery, your proofing and your shop."
    >
      <Sample>
        SAMPLE tour: the names and prices here are made up to show the layout. No photographs appear on this page.
      </Sample>
      <h2>1. Open your link</h2>
      <p>
        The link looks like <code>photo.jerryqiu.com/g/your-event</code>. A cover opens it; a short note of the rules
        appears once, and you continue. If your gallery is private, enter the passcode you were given.
      </p>
      <h2>2. Look around</h2>
      <ul>
        <li>Photos, grouped in albums (some albums have their own passcode).</li>
        <li>Favourites: tap the heart on the ones you like, rate them, approve them, leave a comment.</li>
        <li>Share the link, or download what the gallery allows.</li>
      </ul>
      <h2>3. Order what you love</h2>
      <p>
        Open a photograph and choose a download or a print size. Pay by card. Downloads unlock right away; prints are
        ordered once your payment clears.
      </p>
      <p>
        Looking for prints and downloads? See the <Link href="/shop">shop</Link>.
      </p>
    </Page>
  );
}
