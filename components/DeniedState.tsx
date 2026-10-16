import Link from "next/link";

import { homePath } from "@/lib/authz";
import type { Actor } from "@/lib/types";

export function DeniedState({ actor }: { actor: Actor }) {
  return (
    <section className="panel" role="alert">
      <h1>Access denied</h1>
      <p>This demo session is not allowed to open that record. The server refused the request.</p>
      <Link href={homePath(actor.role)}>Back to your view</Link>
    </section>
  );
}
