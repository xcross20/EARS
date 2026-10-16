import { employees, findTenant } from "@/lib/seed";
import { startDemoSession } from "@/lib/demo-session-actions";

export const dynamic = "force-dynamic";

const roleLabel: Record<string, string> = {
  analyst: "Analyst",
  manager: "Manager",
  auditor: "Auditor",
};

export default async function IdentityPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const params = await searchParams;
  return (
    <section className="identity-page">
      <p className="eyebrow">Fictional financial-services company</p>
      <h1>Choose a demo identity</h1>
      <p className="lede">
        The server issues a signed session for the person you select. A role or tenant typed by the
        browser is ignored.
      </p>
      {params.notice === "unknown-identity" ? (
        <p className="notice" role="alert">
          That demo identity is not in the synthetic directory.
        </p>
      ) : null}
      <div className="identity-grid">
        {employees.map((employee) => {
          const tenant = findTenant(employee.tenantId);
          return (
            <form key={employee.employeeId} action={startDemoSession}>
              <input type="hidden" name="employeeId" value={employee.employeeId} />
              <button type="submit">
                <span className="name">{employee.displayName}</span>
                <span className="meta">
                  {roleLabel[employee.role]} · {tenant?.displayName}
                </span>
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
