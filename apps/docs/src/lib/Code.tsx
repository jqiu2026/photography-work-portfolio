/** A code sample: plain, readable, copyable. */
export function Code({ code, language }: { code: string; language?: string }) {
  return (
    <pre className="docs-code" data-language={language} tabIndex={0} aria-label={`${language ?? "Code"} example`}>
      <code>{code}</code>
    </pre>
  );
}
