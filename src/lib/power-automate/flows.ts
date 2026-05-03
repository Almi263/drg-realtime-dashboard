import "server-only";

export type FlowName =
  | "submissionCreated"
  | "documentDownloaded"
  | "approvalDecisionSubmitted"
  | "approvalAcknowledged"
  | "programAccessChanged";

const FLOW_URLS: Record<FlowName, string | undefined> = {
  submissionCreated: process.env.POWER_AUTOMATE_SUBMISSION_CREATED_URL,
  documentDownloaded: process.env.POWER_AUTOMATE_DOCUMENT_DOWNLOADED_URL,
  approvalDecisionSubmitted:
    process.env.POWER_AUTOMATE_APPROVAL_DECISION_SUBMITTED_URL,
  approvalAcknowledged: process.env.POWER_AUTOMATE_APPROVAL_ACKNOWLEDGED_URL,
  programAccessChanged: process.env.POWER_AUTOMATE_PROGRAM_ACCESS_CHANGED_URL,
};

export async function triggerFlow(
  flowName: FlowName,
  payload: Record<string, unknown>
) {
  const url = FLOW_URLS[flowName];
  if (!url) return { skipped: true };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Power Automate flow failed: ${response.status}${details ? ` - ${details}` : ""}`
    );
  }

  return { skipped: false };
}

export interface AcknowledgeSignedApprovalInput {
  deliverableId: string;
  acceptedSubmissionDocumentId: string;
  signedApprovalDocumentId: string;
  approvalId?: string;
  acknowledgedByEmail: string;
  acknowledgedByName?: string;
  acknowledgedByUserId?: string;
}

export async function acknowledgeSignedApprovalFlow(
  input: AcknowledgeSignedApprovalInput
) {
  if (!input.deliverableId) {
    throw new Error("Deliverable ID is required for acknowledgment.");
  }
  if (!input.acceptedSubmissionDocumentId) {
    throw new Error("Accepted submission document ID is required for acknowledgment.");
  }
  if (!input.signedApprovalDocumentId) {
    throw new Error("Signed approval document ID is required for acknowledgment.");
  }

  return triggerFlow("approvalAcknowledged", {
    deliverableId: input.deliverableId,
    acceptedSubmissionDocumentId: input.acceptedSubmissionDocumentId,
    signedApprovalDocumentId: input.signedApprovalDocumentId,
    approvalId: input.approvalId,
    acknowledgedByEmail: input.acknowledgedByEmail,
    acknowledgedByName: input.acknowledgedByName,
    acknowledgedByUserId: input.acknowledgedByUserId,
  });
}
