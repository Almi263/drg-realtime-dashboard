import { MockDocumentConnector } from "@/lib/connectors/mock-documents";
import type {
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

interface DataverseDocumentRow extends Record<string, unknown> {
  drg_drg_documentid: string;
  drg_drg_name?: string;
  drg_drg_filename?: string;
  drg_drg_filesizekb?: number;
  drg_drg_submissionnumber?: number;
  drg_drg_uploadedbyemail?: string;
  drg_drg_uploadedon?: string;
  _drg_drg_uploadedby_value?: string;
  _drg_drg_deliverable_value?: string;
  _drg_drg_program_value?: string;
  _drg_drg_parentdocument_value?: string;
  _drg_drg_approval_value?: string;
  drg_drg_sharepointsiteurl?: string;
  drg_drg_sharepointdriveid?: string;
  drg_drg_sharepointitemid?: string;
  drg_drg_sharepointurl?: string;
  drg_drg_versionlabel?: string;
  drg_drg_reviewduedate?: string;
  _drg_drg_viewedby_value?: string;
  drg_drg_viewedbyemail?: string;
  drg_drg_viewedon?: string;
  _drg_drg_supersededbydocument_value?: string;
  drg_drg_supersededon?: string;
  drg_drg_checksum?: string;
  drg_drg_iscurrentversion?: boolean;
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
  parentDocumentId?: string;
  approvalId?: string;
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
  };
}

function mapDocumentRow(row: DataverseDocumentRow): DeliverableDocument {
  const fileName = row.drg_drg_filename ?? row.drg_drg_documentid;

  return {
    id: row.drg_drg_documentid,
    name: row.drg_drg_name ?? fileName,
    fileName,
    fileType: toUiFileType(fileName),
    deliverableId: row._drg_drg_deliverable_value ?? "",
    programId: row._drg_drg_program_value ?? "",
    submissionNumber: row.drg_drg_submissionnumber ?? 0,
    documentRole: toDocumentRole(getFormattedValue(row, "drg_drg_documentrole")),
    parentDocumentId: row._drg_drg_parentdocument_value,
    approvalId: row._drg_drg_approval_value,
    sharePointSiteUrl: row.drg_drg_sharepointsiteurl ?? "",
    sharePointDriveId: row.drg_drg_sharepointdriveid ?? "",
    sharePointItemId: row.drg_drg_sharepointitemid ?? "",
    sharePointUrl: row.drg_drg_sharepointurl ?? "",
    versionLabel: row.drg_drg_versionlabel,
    uploadedByUserId: row._drg_drg_uploadedby_value,
    uploadedByEmail: row.drg_drg_uploadedbyemail ?? "",
    uploadedBy: row.drg_drg_uploadedbyemail ?? "",
    uploadedAt: row.drg_drg_uploadedon ?? "",
    status: toUiStatus(getFormattedValue(row, "drg_drg_status")),
    sizeKb: row.drg_drg_filesizekb ?? 0,
    reviewDueDate: row.drg_drg_reviewduedate,
    viewedByUserId: row._drg_drg_viewedby_value,
    viewedByEmail: row.drg_drg_viewedbyemail,
    viewedOn: row.drg_drg_viewedon,
    supersededByDocumentId: row._drg_drg_supersededbydocument_value,
    supersededOn: row.drg_drg_supersededon,
    checksum: row.drg_drg_checksum,
    isCurrentVersion: row.drg_drg_iscurrentversion ?? true,
  };
}

export async function listDocuments(): Promise<DeliverableDocument[]> {
  if (!isDataverseConfigured()) {
    const documents = await new MockDocumentConnector().getDocuments();
    return documents.map(normalizeMockDocument);
  }

  const rows = await listRows<DataverseDocumentRow>(
    "drg_drg_documents",
    "$select=drg_drg_documentid,drg_drg_name,drg_drg_filename,drg_drg_filesizekb,drg_drg_submissionnumber,drg_drg_uploadedbyemail,drg_drg_uploadedon,_drg_drg_uploadedby_value,_drg_drg_deliverable_value,_drg_drg_program_value,_drg_drg_parentdocument_value,_drg_drg_approval_value,drg_drg_sharepointsiteurl,drg_drg_sharepointdriveid,drg_drg_sharepointitemid,drg_drg_sharepointurl,drg_drg_versionlabel,drg_drg_reviewduedate,_drg_drg_viewedby_value,drg_drg_viewedbyemail,drg_drg_viewedon,_drg_drg_supersededbydocument_value,drg_drg_supersededon,drg_drg_checksum,drg_drg_iscurrentversion,drg_drg_documentrole,drg_drg_status&$filter=statecode eq 0 and drg_drg_iscurrentversion eq true"
  );
  return rows.map(mapDocumentRow);
}

export async function listVisibleDocuments(
  user: DataverseUser,
  options: {
    includeArchivedPrograms?: boolean;
    documentRole?: DocumentRole;
    status?: DocumentStatus;
    currentOnly?: boolean;
  } = {}
): Promise<DeliverableDocument[]> {
  const [documents, programs] = await Promise.all([
    listDocuments(),
    listVisiblePrograms(user, {
      includeArchived: options.includeArchivedPrograms,
    }),
  ]);
  const visibleProgramIds = new Set(programs.map((program) => program.id));

  return documents.filter((document) => {
    if (!visibleProgramIds.has(document.programId)) return false;
    if (options.documentRole && document.documentRole !== options.documentRole) {
      return false;
    }
    if (options.status && document.status !== options.status) return false;
    if (options.currentOnly !== false && !document.isCurrentVersion) return false;
    return true;
  });
}

export async function getVisibleDocumentById(id: string, user: DataverseUser) {
  const documents = await listVisibleDocuments(user);
  return documents.find((document) => document.id === id);
}

export async function createDocumentMetadata(input: CreateDocumentMetadataInput) {
  if (!isDataverseConfigured()) {
    throw new Error("Dataverse is not configured for document metadata writes.");
  }

  const payload: Record<string, unknown> = {
    drg_drg_name: input.fileName,
    "drg_drg_program@odata.bind": lookupBind("drg_drg_programs", input.programId),
    "drg_drg_deliverable@odata.bind": lookupBind("drg_drg_deliverables", input.deliverableId),
    drg_drg_filename: input.fileName,
    drg_drg_filesizekb: input.sizeKb,
    drg_drg_sharepointsiteurl: input.sharePointSiteUrl,
    drg_drg_sharepointdriveid: input.sharePointDriveId,
    drg_drg_sharepointitemid: input.sharePointItemId,
    drg_drg_sharepointurl: input.sharePointUrl,
    drg_drg_uploadedbyemail: input.uploadedByEmail,
    drg_drg_uploadedon: new Date().toISOString(),
    drg_drg_documentrole: input.documentRole ?? "DRG Submission",
    drg_drg_status: "Submitted",
    drg_drg_iscurrentversion: true,
    drg_drg_checksum: input.checksum,
    drg_drg_reviewduedate: input.reviewDueDate || undefined,
  };

  if (input.parentDocumentId) {
    payload["drg_drg_parentdocument@odata.bind"] = lookupBind(
      "drg_drg_documents",
      input.parentDocumentId
    );
  }

  if (input.approvalId) {
    payload["drg_drg_approval@odata.bind"] = lookupBind(
      "drg_drg_approvals",
      input.approvalId
    );
  }

  const response = await dataverseFetch<{ drg_drg_documentid?: string }>("/drg_drg_documents", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!response.drg_drg_documentid) {
    throw new Error("Dataverse did not return the created document ID.");
  }

  return response.drg_drg_documentid;
}
