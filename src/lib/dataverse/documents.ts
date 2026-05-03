import { MockDocumentConnector } from "@/lib/connectors/mock-documents";
import type {
  DeliverableDocument,
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
  drg_filename?: string;
  drg_filesizekb?: number;
  drg_uploadedbyemail?: string;
  drg_uploadedon?: string;
  _drg_deliverable_value?: string;
  _drg_program_value?: string;
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
  documentRole?: "DRG Submission" | "Reviewer Response" | "Signed Approval";
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
    case "Final":
    case "Reviewed":
      return "Final";
    case "Under Review":
    case "Returned":
    case "Viewed":
    case "Overdue - Waiting on Reviewer":
      return "Under Review";
    case "Archived":
    case "Outdated":
      return "Archived";
    default:
      return "Draft";
  }
}

function mapDocumentRow(
  row: DataverseDocumentRow,
  accessLog: Awaited<ReturnType<typeof listDocumentAccessEvents>>
): DeliverableDocument {
  const fileName = row.drg_filename ?? row.drg_documentid;

  return {
    id: row.drg_documentid,
    fileName,
    fileType: toUiFileType(fileName),
    deliverableId: row._drg_deliverable_value ?? "",
    programId: row._drg_program_value ?? "",
    uploadedBy: row.drg_uploadedbyemail ?? "",
    uploadedAt: row.drg_uploadedon ?? "",
    status: toUiStatus(getFormattedValue(row, "drg_status")),
    sizeKb: row.drg_filesizekb ?? 0,
    accessLog: accessLog.get(row.drg_documentid) ?? [],
  };
}

export async function listDocuments(): Promise<DeliverableDocument[]> {
  if (!isDataverseConfigured()) {
    return new MockDocumentConnector().getDocuments();
  }

  const rows = await listRows<DataverseDocumentRow>(
    "drg_documents",
    "$select=drg_documentid,drg_filename,drg_filesizekb,drg_uploadedbyemail,drg_uploadedon,_drg_deliverable_value,_drg_program_value,drg_status&$filter=statecode eq 0 and drg_iscurrentversion eq true"
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
  };

  await dataverseFetch<void>("/drg_documents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
