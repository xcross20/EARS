import { currentActor } from "@/lib/actor";
import { evaluateOperation } from "@/lib/authz";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  const decision = evaluateOperation(await currentActor(), "pay");
  return json(decision.body, decision.status);
}
