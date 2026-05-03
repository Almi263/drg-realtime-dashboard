import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import type { Deliverable, DeliverableStatus } from "@/lib/models/deliverable";
import {
  getFormattedValue,
  isDataverseConfigured,
  listRows,
  type DataverseUser,
} from "@/lib/dataverse/client";
import { listVisiblePrograms } from "@/lib/dataverse/programs";
import { toUiDeliverableType } from "@/lib/dataverse/deliverable-types";

interface DataverseDeliverableRow extends Record<string, unknown> {
  drg_deliverableid: string;
  drg_title?: string;
  drg_deliverablenumber?: string;
  drg_contractref?: string;
  drg_description?: string;
  drg_duedate?: string;
  drg_assignedtoemail?: string;
  modifiedon?: string;
  _drg_program_value?: string;
}

function toUiStatus(value: string | undefined): DeliverableStatus {
  switch (value) {
    case "Submitted":
      return "Submitted";
    case "In Review":
    case "Returned":
    case "Pending Acknowledgment":
      return "In Review";
    case "Complete":
      return "Approved";
    default:
      return value?.startsWith("Overdue") ? "Overdue" : "Draft";
  }
}

function mapDeliverableRow(row: DataverseDeliverableRow): Deliverable {
  return {
    id: row.drg_deliverableid,
    title: row.drg_title ?? row.drg_deliverablenumber ?? row.drg_deliverableid,
    type: toUiDeliverableType(getFormattedValue(row, "drg_type")),
    status: toUiStatus(getFormattedValue(row, "drg_status")),
    dueDate: row.drg_duedate ?? "",
    assignedTo: row.drg_assignedtoemail ?? "",
    programId: row._drg_program_value ?? "",
    contractRef: row.drg_contractref ?? "",
    description: row.drg_description ?? "",
    lastUpdated: row.modifiedon ?? "",
  };
}

export async function listDeliverables(): Promise<Deliverable[]> {
  if (!isDataverseConfigured()) {
    return new MockDeliverableConnector().getDeliverables();
  }

  const rows = await listRows<DataverseDeliverableRow>(
    "drg_deliverables",
    "$select=drg_deliverableid,drg_title,drg_deliverablenumber,drg_contractref,drg_description,drg_duedate,drg_assignedtoemail,modifiedon,_drg_program_value,drg_type,drg_status&$filter=statecode eq 0 and drg_isclosed ne true"
  );

  return rows.map(mapDeliverableRow);
}

export async function listVisibleDeliverables(
  user: DataverseUser
): Promise<Deliverable[]> {
  const [deliverables, programs] = await Promise.all([
    listDeliverables(),
    listVisiblePrograms(user),
  ]);
  const visibleProgramIds = new Set(programs.map((program) => program.id));

  return deliverables.filter((deliverable) =>
    visibleProgramIds.has(deliverable.programId)
  );
}

export async function getVisibleDeliverableById(
  id: string,
  user: DataverseUser
) {
  const deliverables = await listVisibleDeliverables(user);
  return deliverables.find((deliverable) => deliverable.id === id);
}
