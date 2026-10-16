import { currentActor } from "@/lib/actor";
import { json } from "@/lib/http";
import { listAuditForActor } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export async function GET() {
  const listed = listAuditForActor(await currentActor());
  if (!listed.ok) {
    return json(listed.body, listed.httpStatus);
  }
  return json({ events: listed.events }, 200);
}

export async function POST() {
  return json({ error: "operation_forbidden" }, 405);
}

export async function PUT() {
  return json({ error: "operation_forbidden" }, 405);
}

export async function DELETE() {
  return json({ error: "operation_forbidden" }, 405);
}
