import { isDataverseConfigured, listRows } from "@/lib/dataverse/client";
import type { DeliverableType } from "@/lib/models/deliverable";

interface DataverseDeliverableTypeRow {
  drg_deliverabletypeid: string;
  drg_name?: string;
  drg_normalizedname?: string;
  drg_isactive?: boolean;
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
    "drg_deliverabletypes",
    "$select=drg_deliverabletypeid,drg_name,drg_normalizedname,drg_isactive&$filter=statecode eq 0 and drg_isactive eq true"
  );

  return rows.map((row) => ({
    id: row.drg_deliverabletypeid,
    name: row.drg_name ?? row.drg_normalizedname ?? row.drg_deliverabletypeid,
    normalizedName:
      row.drg_normalizedname ??
      (row.drg_name ?? row.drg_deliverabletypeid).toLowerCase(),
    isActive: row.drg_isactive !== false,
  }));
}
