export const DELIVERABLE_TYPES = ["CDRL", "SDRL"] as const;
export type DeliverableType = (typeof DELIVERABLE_TYPES)[number];

export const DELIVERABLE_STATUSES = [
  "Draft",
  "In Review",
  "Approved",
  "Submitted",
  "Overdue",
] as const;
export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export interface Deliverable {
  id: string;
  title: string;
  type: DeliverableType;
  status: DeliverableStatus;
  dueDate: string; // ISO 8601
  assignedTo: string;
  contractRef: string;
  description: string;
  lastUpdated: string; // ISO 8601
}
