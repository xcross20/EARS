import { cookies, headers } from "next/headers";

import { actorFromRequestParts } from "./authority";
import { SESSION_COOKIE, sessionSecret } from "./session";

export async function currentActor() {
  const headerList = await headers();
  const jar = await cookies();
  return actorFromRequestParts(
    {
      sessionToken: jar.get(SESSION_COOKIE)?.value,
      headerRole: headerList.get("x-role"),
      headerTenant: headerList.get("x-tenant-id"),
    },
    Date.now(),
    sessionSecret(),
  );
}
