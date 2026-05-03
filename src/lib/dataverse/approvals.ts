import { dataverseFetch, isDataverseConfigured, lookupBind } from "@/lib/dataverse/client";

export interface SubmitApprovalDecisionInput {
  approvalId: string;
  decision: "Approved" | "Rejected";
  comments?: string;
  responseDocumentId?: string;
}

export async function submitApprovalDecision(input: SubmitApprovalDecisionInput) {
  if (!isDataverseConfigured()) {
    throw new Error("Dataverse is not configured for approval writes.");
  }

  const payload: Record<string, unknown> = {
    drg_decision: input.decision,
    drg_comments: input.comments,
    drg_decisiondate: new Date().toISOString(),
  };

  if (input.responseDocumentId) {
    payload["drg_responsedocument@odata.bind"] = lookupBind(
      "drg_documents",
      input.responseDocumentId
    );
  }

  await dataverseFetch<void>(`/drg_approvals(${input.approvalId})`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
