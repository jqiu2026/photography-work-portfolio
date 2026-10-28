export const metadata = { title: "Accessibility" };

export default function Page() {
  return (
    <article className="docs-prose">
      <h1>Accessibility</h1>
      <p>The target is WCAG 2.2 AA, checked with axe in the end-to-end suites at phone and desktop widths.</p>
      <ul>
        <li><strong>Contrast.</strong> Text tokens meet AA on black; muted text is the quietest that still does.</li>
        <li><strong>Keyboard.</strong> Every control is a native element or follows the ARIA pattern for its role, with a visible focus ring.</li>
        <li><strong>Names.</strong> Icon buttons require <code>aria-label</code>; progress bars require one too.</li>
        <li><strong>Motion.</strong> Reduced motion gives a complete still page.</li>
        <li><strong>Feedback.</strong> Toasts are a polite live region; field errors are alerts tied to their control.</li>
      </ul>
    </article>
  );
}
