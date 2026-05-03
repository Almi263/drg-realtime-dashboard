import type { AccessAction, AccessEvent } from "@/lib/models/document";
import { getFormattedValue, isDataverseConfigured, listRows } from "@/lib/dataverse/client";

interface DataverseDocumentAccessLogRow extends Record<string, unknown> {
  drg_documentaccesslogid: string;
  drg_actorname?: string;
  drg_actoremail?: string;
  drg_occurredon?: string;
  _drg_document_value?: string;
}

function toUiAction(value: string | undefined): AccessAction {
  return value === "Download" ? "downloaded" : "viewed";
}

export async function listDocumentAccessEvents(
  documentIds: readonly string[]
): Promise<Map<string, AccessEvent[]>> {
  const grouped = new Map<string, AccessEvent[]>();
  if (!isDataverseConfigured() || documentIds.length === 0) return grouped;

  const rows = await listRows<DataverseDocumentAccessLogRow>(
    "drg_documentaccesslogs",
    "$select=drg_actorname,drg_actoremail,drg_occurredon,_drg_document_value,drg_action&$filter=statecode eq 0&$orderby=drg_occurredon desc"
  );

  const allowedIds = new Set(documentIds);
  for (const row of rows) {
    const documentId = row._drg_document_value;
    if (!documentId || !allowedIds.has(documentId)) continue;

    grouped.set(documentId, [
      ...(grouped.get(documentId) ?? []),
      {
        userId: row.drg_actoremail ?? row.drg_actorname ?? "",
        userName: row.drg_actorname ?? row.drg_actoremail ?? "",
        action: toUiAction(getFormattedValue(row, "drg_action")),
        timestamp: row.drg_occurredon ?? "",
      },
    ]);
  }

  return grouped;
}
