import type { ReactNode } from "react";

export function StudioHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="st-head">
      <h1>{title}</h1>
      {children ? <div className="mk-row">{children}</div> : null}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="st-stat">
      <span className="mk-muted">{label}</span>
      <strong>{value}</strong>
      {hint ? <span className="mk-muted">{hint}</span> : null}
    </div>
  );
}

export const NoDb = () => (
  <p className="mk-note">The database is not set up (DATABASE_URL is missing). See docs/owner-guide.md.</p>
);
