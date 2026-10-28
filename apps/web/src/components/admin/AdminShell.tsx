import type { ReactNode } from "react";
import { AdminSidebar, AdminTopbar } from "./AdminNav";
import { itemsFor } from "./nav";
import { getAdminSite } from "./site";
import { kit } from "@/auth";
import type { AppUser } from "@jerryqiu/auth/server";

export async function AdminShell({ user, children }: { user: AppUser; children: ReactNode }) {
  const site = await getAdminSite();
  const groups = itemsFor(site, user.role);
  return (
    <div className="adm">
      <a href="#main" className="hm-skip">
        Skip to content
      </a>
      <AdminSidebar groups={groups} site={site} />
      <div className="adm-main">
        <AdminTopbar
          groups={groups}
          site={site}
          userEmail={user.email}
          devOpen={kit.isOpenSignIn && user.id === "open-signin"}
        />
        <main id="main" className="adm-content">
          {children}
        </main>
      </div>
    </div>
  );
}
