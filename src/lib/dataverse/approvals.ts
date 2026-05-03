import { canSubmitApprovalDecision } from "@/lib/auth/guards";
import type { InternalRole } from "@/lib/auth/roles";
import type { Approval, ApprovalDecision } from "@/lib/models/approval";
import type { Program } from "@/lib/models/program";
import {
  dataverseFetch,
  getFormattedValue,
  isDataverseConfigured,
  listRows,
  lookupBind,
} from "@/lib/dataverse/client";

interface DataverseApprovalRow extends Record<string, unknown> {
  drg_approvalid: string;
  drg_name?: string;
  _drg_program_value?: string;
  _drg_deliverable_value?: string;
  _drg_document_value?: string;
  drg_submissionnumber?: number;
  _drg_revieweruser_value?: string;
  drg_revieweremail?: string;
  drg_comments?: string;
  _drg_responsedocument_value?: string;
  drg_duedate?: string;
  drg_decisiondate?: string;
  drg_iscurrent?: boolean;
}

export interface SubmitApprovalDecisionInput {
  approvalId: string;
  decision: Exclude<ApprovalDecision, "Pending">;
  comments?: string;
  responseDocumentId?: string;
}

export interface SubmitApprovalDecisionForUserInput
  extends SubmitApprovalDecisionInput {
  user: { email?: string | null; internalRoles: InternalRole[] };
  program: Program;
  approval: Approval;
}

function toApprovalDecision(value: string | undefined): ApprovalDecision {
  switch (value) {
    case "Approved":
    case "Rejected":
    case "Pending":
      return value;
    default:
      return "Pending";
  }
}

function mapApprovalRow(row: DataverseApprovalRow): Approval {
  return {
    id: row.drg_approvalid,
    name: row.drg_name ?? row.drg_approvalid,
    programId: row._drg_program_value ?? "",
    deliverableId: row._drg_deliverable_value ?? "",
    documentId: row._drg_document_value ?? "",
    submissionNumber: row.drg_submissionnumber ?? 0,
    reviewerUserId: row._drg_revieweruser_value,
    reviewerEmail: row.drg_revieweremail ?? "",
    decision: toApprovalDecision(getFormattedValue(row, "drg_decision")),
    comments: row.drg_comments,
    responseDocumentId: row._drg_responsedocument_value,
    dueDate: row.drg_duedate,
    decisionDate: row.drg_decisiondate,
    isCurrent: row.drg_iscurrent ?? false,
  };
}

export async function getApprovalById(id: string): Promise<Approval | undefined> {
  if (!isDataverseConfigured()) return undefined;

  const rows = await listRows<DataverseApprovalRow>(
    "drg_approvals",
    `$select=drg_approvalid,drg_name,_drg_program_value,_drg_deliverable_value,_drg_document_value,drg_submissionnumber,_drg_revieweruser_value,drg_revieweremail,drg_comments,_drg_responsedocument_value,drg_duedate,drg_decisiondate,drg_iscurrent,drg_decision&$filter=statecode eq 0 and drg_approvalid eq ${id}&$top=1`
  );

  return rows[0] ? mapApprovalRow(rows[0]) : undefined;
}

async function patchApprovalDecision(input: SubmitApprovalDecisionInput) {
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

export async function submitApprovalDecision(input: SubmitApprovalDecisionForUserInput) {
  if (!canSubmitApprovalDecision(input.user, input.program, input.approval)) {
    throw new Error("You are not authorized to submit this approval decision.");
  }

  await patchApprovalDecision(input);
}
