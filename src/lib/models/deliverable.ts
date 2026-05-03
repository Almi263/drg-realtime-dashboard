export interface DeliverableType {
  id: string;
  name: string;
  normalizedName: string;
  isActive: boolean;
  createdByUserId?: string;
}

export const DELIVERABLE_STATUSES = [
  "Not Submitted",
  "Submitted",
  "In Review",
  "Returned",
  "Pending Acknowledgment",
  "Complete",
  "Overdue - Waiting on Reviewer",
  "Overdue - Waiting on DRG",
] as const;
export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export interface Deliverable {
  id: string;
  title: string;
  deliverableNumber: string;
  typeId: string;
  type: string;
  status: DeliverableStatus;
  dueDate: string;
  assignedToUserId?: string;
  assignedToEmail?: string;
  assignedTo: string;
  programId: string;
  contractRef: string;
  description: string;
  lastSubmittedOn?: string;
  lastApprovedOn?: string;
  acknowledgedByUserId?: string;
  acknowledgedByEmail?: string;
  acknowledgedOn?: string;
  currentSubmissionNumber?: number;
  isClosed: boolean;
  lastUpdated: string;
}
