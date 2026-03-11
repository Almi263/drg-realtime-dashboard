export const FILE_TYPES = ["Word", "PDF", "Excel", "PowerPoint"] as const;
export type FileType = (typeof FILE_TYPES)[number];

export const DOCUMENT_STATUSES = [
  "Draft",
  "Final",
  "Under Review",
  "Archived",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const ACCESS_ACTIONS = ["viewed", "downloaded"] as const;
export type AccessAction = (typeof ACCESS_ACTIONS)[number];

export interface AccessEvent {
  userId: string;
  userName: string;
  action: AccessAction;
  timestamp: string; // ISO 8601
}

export interface DeliverableDocument {
  id: string;
  fileName: string;
  fileType: FileType;
  deliverableId: string;
  programId: string;
  uploadedBy: string;
  uploadedAt: string; // ISO 8601
  status: DocumentStatus;
  sizeKb: number;
  accessLog: AccessEvent[];
}
