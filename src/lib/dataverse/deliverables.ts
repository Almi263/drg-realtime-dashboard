import { MockDeliverableConnector } from "@/lib/connectors/mock-deliverables";
import type { Deliverable, DeliverableStatus } from "@/lib/models/deliverable";
import {
  dataverseFetch,
  escapeODataString,
  getFormattedValue,
  isDataverseConfigured,
  listRows,
  lookupBind,
  type DataverseUser,
} from "@/lib/dataverse/client";
import { listVisiblePrograms } from "@/lib/dataverse/programs";
import { toDeliverableTypeName } from "@/lib/dataverse/deliverable-types";
import { normalizeEmail } from "@/lib/auth/roles";

interface DataverseDeliverableRow extends Record<string, unknown> {
  drg_drg_deliverableid: string;
  drg_drg_title?: string;
  drg_drg_deliverablenumber?: string;
  drg_drg_contractref?: string;
  drg_drg_description?: string;
  drg_drg_duedate?: string;
  drg_drg_assignedtoemail?: string;
  _drg_drg_assignedtouser_value?: string;
  drg_drg_lastsubmittedon?: string;
  drg_drg_lastapprovedon?: string;
  _drg_drg_acknowledgedby_value?: string;
  drg_drg_acknowledgedbyemail?: string;
  drg_drg_acknowledgedon?: string;
  drg_drg_currentsubmissionnumber?: number;
  drg_drg_isclosed?: boolean;
  modifiedon?: string;
  _drg_drg_program_value?: string;
  _drg_drg_type_value?: string;
}

interface DataverseSystemUserRow {
  systemuserid: string;
}

export interface CreateDeliverableInput {
  title: string;
  deliverableNumber: string;
  programId: string;
  contractRef: string;
  typeId: string;
  description?: string;
  dueDate: string;
  assignedToEmail?: string;
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
    id: row.drg_drg_deliverableid,
    title: row.drg_drg_title ?? row.drg_drg_deliverablenumber ?? row.drg_drg_deliverableid,
    deliverableNumber: row.drg_drg_deliverablenumber ?? row.drg_drg_deliverableid,
    typeId: row._drg_drg_type_value ?? "",
    type: toDeliverableTypeName(
      getFormattedValue(row, "_drg_drg_type_value") ?? getFormattedValue(row, "drg_drg_type")
    ),
    status: toUiStatus(getFormattedValue(row, "drg_drg_status")),
    dueDate: row.drg_drg_duedate ?? "",
    assignedToUserId: row._drg_drg_assignedtouser_value,
    assignedToEmail: row.drg_drg_assignedtoemail,
    assignedTo: row.drg_drg_assignedtoemail ?? "",
    programId: row._drg_drg_program_value ?? "",
    contractRef: row.drg_drg_contractref ?? "",
    description: row.drg_drg_description ?? "",
    lastSubmittedOn: row.drg_drg_lastsubmittedon,
    lastApprovedOn: row.drg_drg_lastapprovedon,
    acknowledgedByUserId: row._drg_drg_acknowledgedby_value,
    acknowledgedByEmail: row.drg_drg_acknowledgedbyemail,
    acknowledgedOn: row.drg_drg_acknowledgedon,
    currentSubmissionNumber: row.drg_drg_currentsubmissionnumber,
    isClosed: row.drg_drg_isclosed ?? false,
    lastUpdated: row.modifiedon ?? "",
  };
}

export async function listDeliverables(): Promise<Deliverable[]> {
  if (!isDataverseConfigured()) {
    const deliverables = await new MockDeliverableConnector().getDeliverables();
    return deliverables.map(normalizeMockDeliverable);
  }

  const rows = await listRows<DataverseDeliverableRow>(
    "drg_drg_deliverables",
    "$select=drg_drg_deliverableid,drg_drg_title,drg_drg_deliverablenumber,drg_drg_contractref,drg_drg_description,drg_drg_duedate,drg_drg_assignedtoemail,_drg_drg_assignedtouser_value,drg_drg_lastsubmittedon,drg_drg_lastapprovedon,_drg_drg_acknowledgedby_value,drg_drg_acknowledgedbyemail,drg_drg_acknowledgedon,drg_drg_currentsubmissionnumber,drg_drg_isclosed,modifiedon,_drg_drg_program_value,_drg_drg_type_value,drg_drg_status&$filter=statecode eq 0 and drg_drg_isclosed ne true"
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

async function findSystemUserIdByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return undefined;

  const escapedEmail = escapeODataString(normalizedEmail);
  const rows = await listRows<DataverseSystemUserRow>(
    "systemusers",
    `$select=systemuserid&$top=1&$filter=internalemailaddress eq '${escapedEmail}' or domainname eq '${escapedEmail}'`
  );

  return rows[0]?.systemuserid;
}

export async function createDeliverable(input: CreateDeliverableInput) {
  if (!isDataverseConfigured()) {
    throw new Error("Dataverse is not configured for deliverable creation.");
  }

  const assignedToEmail = normalizeEmail(input.assignedToEmail);
  const assignedToUserId = assignedToEmail
    ? await findSystemUserIdByEmail(assignedToEmail)
    : undefined;

  const payload: Record<string, unknown> = {
    drg_drg_title: input.title,
    drg_drg_deliverablenumber: input.deliverableNumber,
    "drg_drg_program@odata.bind": lookupBind("drg_drg_programs", input.programId),
    drg_drg_contractref: input.contractRef,
    "drg_drg_type@odata.bind": lookupBind("drg_drg_deliverabletypes", input.typeId),
    drg_drg_description: input.description ?? "",
    drg_drg_duedate: input.dueDate,
    drg_drg_assignedtoemail: assignedToEmail,
    drg_drg_isclosed: false,
  };

  if (assignedToUserId) {
    payload["drg_drg_assignedtouser@odata.bind"] = lookupBind(
      "systemusers",
      assignedToUserId
    );
  }

  const response = await dataverseFetch<{ drg_drg_deliverableid?: string }>(
    "/drg_drg_deliverables",
    {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    }
  );

  const deliverableId = response.drg_drg_deliverableid;
  if (!deliverableId) {
    throw new Error("Dataverse did not return the created deliverable ID.");
  }

  return deliverableId;
}
