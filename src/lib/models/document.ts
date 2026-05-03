export const DOCUMENT_ROLES = [
  "DRG Submission",
  "Reviewer Response",
  "Signed Approval",
] as const;
export type DocumentRole = (typeof DOCUMENT_ROLES)[number];

export const DOCUMENT_STATUSES = [
  "Submitted",
  "Under Review",
  "Returned",
  "Viewed",
  "Outdated",
  "Overdue - Waiting on Reviewer",
  "Reviewed",
  "Final",
  "Archived",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_ACCESS_ACTIONS = [
  "View",
  "Download",
  "Upload",
  "Delete",
  "Acknowledge",
] as const;
export type DocumentAccessAction = (typeof DOCUMENT_ACCESS_ACTIONS)[number];

export const FILE_TYPES = ["Word", "PDF", "Excel", "PowerPoint"] as const;
export type FileType = (typeof FILE_TYPES)[number];

export interface DocumentAccessLog {
  id: string;
  documentId: string;
  programId: string;
  actorUserId?: string;
  actorName: string;
  actorEmail: string;
  action: DocumentAccessAction;
  occurredOn: string;
  source?: "Web App" | "SharePoint" | "Teams" | "API";
}

export interface DeliverableDocument {
  id: string;
  name: string;
  fileName: string;
  fileType: FileType;
  deliverableId: string;
  programId: string;
  submissionNumber: number;
  documentRole: DocumentRole;
  parentDocumentId?: string;
  approvalId?: string;
  sharePointSiteUrl: string;
  sharePointDriveId: string;
  sharePointItemId: string;
  sharePointUrl: string;
  versionLabel?: string;
  uploadedByUserId?: string;
  uploadedByEmail: string;
  uploadedBy: string;
  uploadedAt: string;
  status: DocumentStatus;
  sizeKb: number;
  reviewDueDate?: string;
  viewedByUserId?: string;
  viewedByEmail?: string;
  viewedOn?: string;
  supersededByDocumentId?: string;
  supersededOn?: string;
  checksum?: string;
  isCurrentVersion: boolean;
}
