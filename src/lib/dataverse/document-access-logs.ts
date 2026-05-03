import type {
  DocumentAccessAction,
  DocumentAccessLog,
} from "@/lib/models/document";
import {
  dataverseFetch,
  getFormattedValue,
  isDataverseConfigured,
  listRows,
  lookupBind,
} from "@/lib/dataverse/client";

interface DataverseDocumentAccessLogRow extends Record<string, unknown> {
  drg_documentaccesslogid: string;
  drg_actorname?: string;
  drg_actoremail?: string;
  drg_occurredon?: string;
  _drg_document_value?: string;
  _drg_program_value?: string;
  _drg_actoruser_value?: string;
}

function toDocumentAccessAction(value: string | undefined): DocumentAccessAction {
  switch (value) {
    case "Download":
    case "Upload":
    case "Delete":
    case "Acknowledge":
    case "View":
      return value;
    default:
      return "View";
  }
}

function mapAccessLogRow(row: DataverseDocumentAccessLogRow): DocumentAccessLog {
  return {
    id: row.drg_documentaccesslogid,
    documentId: row._drg_document_value ?? "",
    programId: row._drg_program_value ?? "",
    actorUserId: row._drg_actoruser_value,
    actorName: row.drg_actorname ?? row.drg_actoremail ?? "",
    actorEmail: row.drg_actoremail ?? "",
    action: toDocumentAccessAction(getFormattedValue(row, "drg_action")),
    occurredOn: row.drg_occurredon ?? "",
    source: getFormattedValue(row, "drg_source") as DocumentAccessLog["source"],
  };
}

export async function listDocumentAccessLogs(
  documentIds: readonly string[]
): Promise<Map<string, DocumentAccessLog[]>> {
  const grouped = new Map<string, DocumentAccessLog[]>();
  if (!isDataverseConfigured() || documentIds.length === 0) return grouped;

  const rows = await listRows<DataverseDocumentAccessLogRow>(
    "drg_documentaccesslogs",
    "$select=drg_documentaccesslogid,drg_actorname,drg_actoremail,drg_occurredon,_drg_document_value,_drg_program_value,_drg_actoruser_value,drg_action,drg_source&$filter=statecode eq 0&$orderby=drg_occurredon desc"
  );

  const allowedIds = new Set(documentIds);
  for (const row of rows) {
    const documentId = row._drg_document_value;
    if (!documentId || !allowedIds.has(documentId)) continue;

    grouped.set(documentId, [
      ...(grouped.get(documentId) ?? []),
      mapAccessLogRow(row),
    ]);
  }

  return grouped;
}

export async function listProgramDocumentAccessLogs(
  programIds: readonly string[]
): Promise<DocumentAccessLog[]> {
  if (!isDataverseConfigured() || programIds.length === 0) return [];

  const rows = await listRows<DataverseDocumentAccessLogRow>(
    "drg_documentaccesslogs",
    "$select=drg_documentaccesslogid,drg_actorname,drg_actoremail,drg_occurredon,_drg_document_value,_drg_program_value,_drg_actoruser_value,drg_action,drg_source&$filter=statecode eq 0&$orderby=drg_occurredon desc"
  );
  const allowedIds = new Set(programIds);

  return rows
    .map(mapAccessLogRow)
    .filter((log) => allowedIds.has(log.programId));
}

export async function createDocumentAccessLog(input: {
  documentId: string;
  programId: string;
  actorUserId?: string;
  actorName: string;
  actorEmail: string;
  action: DocumentAccessAction;
  source?: "Web App" | "SharePoint" | "Teams" | "API";
}) {
  if (!isDataverseConfigured()) return;

  const occurredOn = new Date().toISOString();
  const payload: Record<string, unknown> = {
    drg_name: `${input.action} | ${input.actorEmail} | ${occurredOn}`,
    "drg_document@odata.bind": lookupBind("drg_documents", input.documentId),
    "drg_program@odata.bind": lookupBind("drg_programs", input.programId),
    drg_actorname: input.actorName,
    drg_actoremail: input.actorEmail,
    drg_action: input.action,
    drg_occurredon: occurredOn,
    drg_source: input.source ?? "Web App",
  };

  if (input.actorUserId) {
    payload["drg_actoruser@odata.bind"] = lookupBind(
      "systemusers",
      input.actorUserId
    );
  }

  await dataverseFetch<void>("/drg_documentaccesslogs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
