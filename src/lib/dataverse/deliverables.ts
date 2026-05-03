import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import type { Deliverable, DeliverableStatus } from "@/lib/models/deliverable";
import {
  getFormattedValue,
  isDataverseConfigured,
  listRows,
  type DataverseUser,
} from "@/lib/dataverse/client";
import { listVisiblePrograms } from "@/lib/dataverse/programs";
import { toDeliverableTypeName } from "@/lib/dataverse/deliverable-types";

interface DataverseDeliverableRow extends Record<string, unknown> {
  drg_deliverableid: string;
  drg_title?: string;
  drg_deliverablenumber?: string;
  drg_contractref?: string;
  drg_description?: string;
  drg_duedate?: string;
  drg_assignedtoemail?: string;
  _drg_assignedtouser_value?: string;
  drg_lastsubmittedon?: string;
  drg_lastapprovedon?: string;
  _drg_acknowledgedby_value?: string;
  drg_acknowledgedbyemail?: string;
  drg_acknowledgedon?: string;
  drg_currentsubmissionnumber?: number;
  drg_isclosed?: boolean;
  modifiedon?: string;
  _drg_program_value?: string;
  _drg_type_value?: string;
}

function toUiStatus(value: string | undefined): DeliverableStatus {
  switch (value) {
    case "Not Submitted":
    case "Submitted":
    case "In Review":
    case "Returned":
    case "Pending Acknowledgment":
    case "Complete":
    case "Overdue - Waiting on Reviewer":
    case "Overdue - Waiting on DRG":
      return value;
    default:
      return "Not Submitted";
  }
}

function normalizeMockDeliverable(deliverable: Deliverable): Deliverable {
  const legacy = deliverable as unknown as { status?: string; type?: string };
  const statusMap: Record<string, DeliverableStatus> = {
    Draft: "Not Submitted",
    Approved: "Complete",
    Overdue: "Overdue - Waiting on Reviewer",
  };
  const type = legacy.type ?? deliverable.type ?? "CDRL";

  return {
    ...deliverable,
    deliverableNumber: deliverable.deliverableNumber ?? deliverable.id,
    type,
    typeId: deliverable.typeId ?? type,
    status: statusMap[legacy.status ?? ""] ?? toUiStatus(legacy.status),
    assignedToEmail: deliverable.assignedToEmail ?? deliverable.assignedTo,
    isClosed: deliverable.isClosed ?? false,
  };
}

function mapDeliverableRow(row: DataverseDeliverableRow): Deliverable {
  return {
    id: row.drg_deliverableid,
    title: row.drg_title ?? row.drg_deliverablenumber ?? row.drg_deliverableid,
    deliverableNumber: row.drg_deliverablenumber ?? row.drg_deliverableid,
    typeId: row._drg_type_value ?? "",
    type: toDeliverableTypeName(
      getFormattedValue(row, "_drg_type_value") ?? getFormattedValue(row, "drg_type")
    ),
    status: toUiStatus(getFormattedValue(row, "drg_status")),
    dueDate: row.drg_duedate ?? "",
    assignedToUserId: row._drg_assignedtouser_value,
    assignedToEmail: row.drg_assignedtoemail,
    assignedTo: row.drg_assignedtoemail ?? "",
    programId: row._drg_program_value ?? "",
    contractRef: row.drg_contractref ?? "",
    description: row.drg_description ?? "",
    lastSubmittedOn: row.drg_lastsubmittedon,
    lastApprovedOn: row.drg_lastapprovedon,
    acknowledgedByUserId: row._drg_acknowledgedby_value,
    acknowledgedByEmail: row.drg_acknowledgedbyemail,
    acknowledgedOn: row.drg_acknowledgedon,
    currentSubmissionNumber: row.drg_currentsubmissionnumber,
    isClosed: row.drg_isclosed ?? false,
    lastUpdated: row.modifiedon ?? "",
  };
}

export async function listDeliverables(): Promise<Deliverable[]> {
  if (!isDataverseConfigured()) {
    const deliverables = await new MockDeliverableConnector().getDeliverables();
    return deliverables.map(normalizeMockDeliverable);
  }

  const rows = await listRows<DataverseDeliverableRow>(
    "drg_deliverables",
    "$select=drg_deliverableid,drg_title,drg_deliverablenumber,drg_contractref,drg_description,drg_duedate,drg_assignedtoemail,_drg_assignedtouser_value,drg_lastsubmittedon,drg_lastapprovedon,_drg_acknowledgedby_value,drg_acknowledgedbyemail,drg_acknowledgedon,drg_currentsubmissionnumber,drg_isclosed,modifiedon,_drg_program_value,_drg_type_value,drg_status&$filter=statecode eq 0 and drg_isclosed ne true"
  );

  return rows.map(mapDeliverableRow);
}

export async function listVisibleDeliverables(
  user: DataverseUser,
  options: { includeArchivedPrograms?: boolean } = {}
): Promise<Deliverable[]> {
  const [deliverables, programs] = await Promise.all([
    listDeliverables(),
    listVisiblePrograms(user, {
      includeArchived: options.includeArchivedPrograms,
    }),
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
