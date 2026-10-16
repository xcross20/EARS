export function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}
