import { Prose } from "@placeholder/ui";

export const metadata = { title: "Changelog" };

export default function Page() {
  return (
    <Prose>
      <h1>Changelog</h1>
      <p>Releases are managed with Changesets (see <code>.changeset/</code> and <code>CHANGELOG.md</code>). The package is not published yet.</p>
      <h2>0.1.0 (unreleased)</h2>
      <ul><li>First public API: layout, typography, forms, overlays, navigation, profile and site components, motion, media and WebGL entry points.</li></ul>
    </Prose>
  );
}
