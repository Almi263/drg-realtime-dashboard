export const APPROVAL_DECISIONS = ["Pending", "Approved", "Rejected"] as const;
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number];

export interface Approval {
  id: string;
  name: string;
  programId: string;
  deliverableId: string;
  documentId: string;
  submissionNumber: number;
  reviewerUserId?: string;
  reviewerEmail: string;
  decision: ApprovalDecision;
  comments?: string;
  responseDocumentId?: string;
  dueDate?: string;
  decisionDate?: string;
  isCurrent: boolean;
}
