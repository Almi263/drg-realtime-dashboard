import {
  dataverseFetch,
  isDataverseConfigured,
  listRows,
} from "@/lib/dataverse/client";
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

function normalizeTypeName(value: string) {
  return value.trim().toLowerCase();
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

export async function createDeliverableType(name: string): Promise<DeliverableType> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Deliverable type name is required.");
  }

  if (!isDataverseConfigured()) {
    return {
      id: trimmedName,
      name: trimmedName,
      normalizedName: normalizeTypeName(trimmedName),
      isActive: true,
    };
  }

  const response = await dataverseFetch<DataverseDeliverableTypeRow>(
    "/drg_deliverabletypes",
    {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        drg_name: trimmedName,
        drg_normalizedname: normalizeTypeName(trimmedName),
        drg_isactive: true,
      }),
    }
  );

  return {
    id: response.drg_deliverabletypeid,
    name: response.drg_name ?? trimmedName,
    normalizedName: response.drg_normalizedname ?? normalizeTypeName(trimmedName),
    isActive: response.drg_isactive !== false,
  };
}
