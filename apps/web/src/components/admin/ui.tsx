import type { ReactNode } from "react";

export function PageHead({ title, lede, actions }: { title: string; lede?: ReactNode; actions?: ReactNode }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div className="adm-toolbar" style={{ marginBottom: 0 }}>
        <h1 className="adm-h1">{title}</h1>
        {actions ? <div style={{ display: "flex", gap: "0.5rem" }}>{actions}</div> : null}
      </div>
      {lede ? (
        <p className="adm-lede" style={{ marginBottom: 0 }}>
          {lede}
        </p>
      ) : null}
    </div>
  );
}

export function NoDb() {
  return (
    <div className="adm-card" role="status">
      <h2>The database isn't set up</h2>
      <p>
        Set DATABASE_URL (in production a free Neon database; locally `pnpm dev` starts one). Until then the public
        sites keep using the content in the repository. See docs/owner-guide.md.
      </p>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="adm-note" style={{ padding: "2rem 0" }}>
      {children}
    </p>
  );
}
