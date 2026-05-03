import { MockDocumentConnector } from "@/lib/connectors/mock-documents";
import type {
  AccessEvent,
  DeliverableDocument,
  DocumentRole,
  DocumentStatus,
  FileType,
} from "@/lib/models/document";
import {
  dataverseFetch,
  getFormattedValue,
  isDataverseConfigured,
  listRows,
  lookupBind,
  type DataverseUser,
} from "@/lib/dataverse/client";
import { listVisiblePrograms } from "@/lib/dataverse/programs";
import { listDocumentAccessEvents } from "@/lib/dataverse/document-access-logs";

interface DataverseDocumentRow extends Record<string, unknown> {
  drg_documentid: string;
  drg_name?: string;
  drg_filename?: string;
  drg_filesizekb?: number;
  drg_submissionnumber?: number;
  drg_uploadedbyemail?: string;
  drg_uploadedon?: string;
  _drg_uploadedby_value?: string;
  _drg_deliverable_value?: string;
  _drg_program_value?: string;
  _drg_parentdocument_value?: string;
  _drg_approval_value?: string;
  drg_sharepointsiteurl?: string;
  drg_sharepointdriveid?: string;
  drg_sharepointitemid?: string;
  drg_sharepointurl?: string;
  drg_versionlabel?: string;
  drg_reviewduedate?: string;
  _drg_viewedby_value?: string;
  drg_viewedbyemail?: string;
  drg_viewedon?: string;
  _drg_supersededbydocument_value?: string;
  drg_supersededon?: string;
  drg_checksum?: string;
  drg_iscurrentversion?: boolean;
}

export interface CreateDocumentMetadataInput {
  programId: string;
  deliverableId: string;
  fileName: string;
  sizeKb: number;
  uploadedByEmail: string;
  sharePointSiteUrl: string;
  sharePointDriveId: string;
  sharePointItemId: string;
  sharePointUrl: string;
  checksum?: string;
  documentRole?: DocumentRole;
  reviewDueDate?: string;
}

function toUiFileType(fileName: string): FileType {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "doc":
    case "docx":
      return "Word";
    case "xls":
    case "xlsx":
      return "Excel";
    case "ppt":
    case "pptx":
      return "PowerPoint";
    default:
      return "PDF";
  }
}

function toUiStatus(value: string | undefined): DocumentStatus {
  switch (value) {
    case "Submitted":
    case "Under Review":
    case "Returned":
    case "Viewed":
    case "Outdated":
    case "Overdue - Waiting on Reviewer":
    case "Final":
    case "Reviewed":
    case "Archived":
      return value;
    default:
      return "Submitted";
  }
}

function toDocumentRole(value: string | undefined): DocumentRole {
  switch (value) {
    case "Reviewer Response":
    case "Signed Approval":
    case "DRG Submission":
      return value;
    default:
      return "DRG Submission";
  }
}

function normalizeMockDocument(document: DeliverableDocument): DeliverableDocument {
  const legacy = document as unknown as {
    status?: string;
    accessLog?: Array<AccessEvent & { action: string }>;
  };
  const statusMap: Record<string, DocumentStatus> = {
    Draft: "Submitted",
  };

  return {
    ...document,
    name: document.name ?? document.fileName,
    submissionNumber: document.submissionNumber ?? 1,
    documentRole: document.documentRole ?? "DRG Submission",
    uploadedByEmail: document.uploadedByEmail ?? document.uploadedBy,
    sharePointSiteUrl: document.sharePointSiteUrl ?? "",
    sharePointDriveId: document.sharePointDriveId ?? "",
    sharePointItemId: document.sharePointItemId ?? document.id,
    sharePointUrl: document.sharePointUrl ?? "",
    status: statusMap[legacy.status ?? ""] ?? toUiStatus(legacy.status),
    isCurrentVersion: document.isCurrentVersion ?? true,
    accessLog:
      legacy.accessLog?.map((event) => ({
        ...event,
        action:
          String(event.action) === "downloaded"
            ? "Download"
            : String(event.action) === "viewed"
              ? "View"
              : event.action,
      })) ?? [],
  };
}

function mapDocumentRow(
  row: DataverseDocumentRow,
  accessLog: Awaited<ReturnType<typeof listDocumentAccessEvents>>
): DeliverableDocument {
  const fileName = row.drg_filename ?? row.drg_documentid;

  return {
    id: row.drg_documentid,
    name: row.drg_name ?? fileName,
    fileName,
    fileType: toUiFileType(fileName),
    deliverableId: row._drg_deliverable_value ?? "",
    programId: row._drg_program_value ?? "",
    submissionNumber: row.drg_submissionnumber ?? 0,
    documentRole: toDocumentRole(getFormattedValue(row, "drg_documentrole")),
    parentDocumentId: row._drg_parentdocument_value,
    approvalId: row._drg_approval_value,
    sharePointSiteUrl: row.drg_sharepointsiteurl ?? "",
    sharePointDriveId: row.drg_sharepointdriveid ?? "",
    sharePointItemId: row.drg_sharepointitemid ?? "",
    sharePointUrl: row.drg_sharepointurl ?? "",
    versionLabel: row.drg_versionlabel,
    uploadedByUserId: row._drg_uploadedby_value,
    uploadedByEmail: row.drg_uploadedbyemail ?? "",
    uploadedBy: row.drg_uploadedbyemail ?? "",
    uploadedAt: row.drg_uploadedon ?? "",
    status: toUiStatus(getFormattedValue(row, "drg_status")),
    sizeKb: row.drg_filesizekb ?? 0,
    reviewDueDate: row.drg_reviewduedate,
    viewedByUserId: row._drg_viewedby_value,
    viewedByEmail: row.drg_viewedbyemail,
    viewedOn: row.drg_viewedon,
    supersededByDocumentId: row._drg_supersededbydocument_value,
    supersededOn: row.drg_supersededon,
    checksum: row.drg_checksum,
    isCurrentVersion: row.drg_iscurrentversion ?? true,
    accessLog: accessLog.get(row.drg_documentid) ?? [],
  };
}

export async function listDocuments(): Promise<DeliverableDocument[]> {
  if (!isDataverseConfigured()) {
    const documents = await new MockDocumentConnector().getDocuments();
    return documents.map(normalizeMockDocument);
  }

  const rows = await listRows<DataverseDocumentRow>(
    "drg_documents",
    "$select=drg_documentid,drg_name,drg_filename,drg_filesizekb,drg_submissionnumber,drg_uploadedbyemail,drg_uploadedon,_drg_uploadedby_value,_drg_deliverable_value,_drg_program_value,_drg_parentdocument_value,_drg_approval_value,drg_sharepointsiteurl,drg_sharepointdriveid,drg_sharepointitemid,drg_sharepointurl,drg_versionlabel,drg_reviewduedate,_drg_viewedby_value,drg_viewedbyemail,drg_viewedon,_drg_supersededbydocument_value,drg_supersededon,drg_checksum,drg_iscurrentversion,drg_documentrole,drg_status&$filter=statecode eq 0 and drg_iscurrentversion eq true"
  );
  const accessLog = await listDocumentAccessEvents(
    rows.map((row) => row.drg_documentid)
  );

  return rows.map((row) => mapDocumentRow(row, accessLog));
}

export async function listVisibleDocuments(
  user: DataverseUser
): Promise<DeliverableDocument[]> {
  const [documents, programs] = await Promise.all([
    listDocuments(),
    listVisiblePrograms(user),
  ]);
  const visibleProgramIds = new Set(programs.map((program) => program.id));

  return documents.filter((document) => visibleProgramIds.has(document.programId));
}

export async function getVisibleDocumentById(id: string, user: DataverseUser) {
  const documents = await listVisibleDocuments(user);
  return documents.find((document) => document.id === id);
}

export async function createDocumentMetadata(input: CreateDocumentMetadataInput) {
  if (!isDataverseConfigured()) {
    throw new Error("Dataverse is not configured for document metadata writes.");
  }

  const payload = {
    drg_name: input.fileName,
    "drg_program@odata.bind": lookupBind("drg_programs", input.programId),
    "drg_deliverable@odata.bind": lookupBind("drg_deliverables", input.deliverableId),
    drg_filename: input.fileName,
    drg_filesizekb: input.sizeKb,
    drg_sharepointsiteurl: input.sharePointSiteUrl,
    drg_sharepointdriveid: input.sharePointDriveId,
    drg_sharepointitemid: input.sharePointItemId,
    drg_sharepointurl: input.sharePointUrl,
    drg_uploadedbyemail: input.uploadedByEmail,
    drg_uploadedon: new Date().toISOString(),
    drg_documentrole: input.documentRole ?? "DRG Submission",
    drg_status: "Submitted",
    drg_iscurrentversion: true,
    drg_checksum: input.checksum,
    drg_reviewduedate: input.reviewDueDate || undefined,
  };

  await dataverseFetch<void>("/drg_documents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
