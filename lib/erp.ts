import { findVendor } from "./seed";
import type { Actor } from "./types";

export type ErpLookup =
  | {
      ok: true;
      vendorId: string;
      legalName: string;
      status: "active";
      citationId: string;
    }
  | { ok: false; reason: "access_denied" | "erp_unavailable" | "not_found" };

export function lookupVendorForActor(actor: Actor, vendorId: string): ErpLookup {
  const vendor = findVendor(vendorId);
  if (!vendor || vendor.tenantId !== actor.tenantId) {
    return { ok: false, reason: vendor ? "access_denied" : "not_found" };
  }
  if (vendor.erpAvailability === "unavailable") {
    return { ok: false, reason: "erp_unavailable" };
  }
  return {
    ok: true,
    vendorId: vendor.vendorId,
    legalName: vendor.legalName,
    status: vendor.status,
    citationId: `erp:${vendor.vendorId}`,
  };
}
