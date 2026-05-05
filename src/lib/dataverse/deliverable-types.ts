import { isDataverseConfigured, listRows } from "@/lib/dataverse/client";
import type { DeliverableType } from "@/lib/models/deliverable";

interface DataverseDeliverableTypeRow {
  drg_drg_deliverabletypeid: string;
  drg_drg_name?: string;
  drg_drg_normalizedname?: string;
  drg_drg_isactive?: boolean;
}

export function toDeliverableTypeName(value: string | undefined) {
  return value?.trim() || "CDRL";
}

export async function listDeliverableTypes(): Promise<DeliverableType[]> {
  if (!isDataverseConfigured()) {
    return ["CDRL", "SDRL"].map((type) => ({
      id: type,
      name: type,
      normalizedName: type.toLowerCase(),
      isActive: true,
    }));
  }

  const rows = await listRows<DataverseDeliverableTypeRow>(
    "drg_drg_deliverabletypes",
    "$select=drg_drg_deliverabletypeid,drg_drg_name,drg_drg_normalizedname,drg_drg_isactive&$filter=statecode eq 0 and drg_drg_isactive eq true"
  );

  return rows.map((row) => ({
    id: row.drg_drg_deliverabletypeid,
    name: row.drg_drg_name ?? row.drg_drg_normalizedname ?? row.drg_drg_deliverabletypeid,
    normalizedName:
      row.drg_drg_normalizedname ??
      (row.drg_drg_name ?? row.drg_drg_deliverabletypeid).toLowerCase(),
    isActive: row.drg_drg_isactive !== false,
  }));
}
