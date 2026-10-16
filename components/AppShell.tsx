import Link from "next/link";

import { endDemoSession } from "@/lib/demo-session-actions";
import { navigationFor } from "@/lib/authz";
import type { Actor } from "@/lib/types";

export function AppShell({ actor, children }: { actor: Actor; children: React.ReactNode }) {
  const navigation = navigationFor(actor.role);
  return (
    <div className="shell">
      <aside className="side">
        <p className="eyebrow">{actor.tenantDisplayName}</p>
        <p className="identity-name">{actor.displayName}</p>
        <p className="identity-title">{actor.title}</p>
        <nav aria-label="Role navigation">
          <ul>
            {navigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <form action={endDemoSession}>
          <button type="submit" className="text-button">
            End demo session
          </button>
        </form>
      </aside>
      <div className="content">{children}</div>
    </div>
  );
}
