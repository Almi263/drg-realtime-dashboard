import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { acknowledgeApproval, getApprovalById } from "@/lib/dataverse/approvals";
import { createDocumentAccessLog } from "@/lib/dataverse/document-access-logs";
import { getProgramById } from "@/lib/dataverse/programs";
import { businessRuleResponse, errorResponse } from "@/lib/errors/business-rules";
import { acknowledgeSignedApprovalFlow } from "@/lib/power-automate/flows";

function requiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id: approvalId } = await params;
  const approval = await getApprovalById(approvalId);

  if (!approval) {
    return NextResponse.json({ error: "Approval not found." }, { status: 404 });
  }

  const program = await getProgramById(approval.programId, session.user);

  if (!program) {
    return NextResponse.json({ error: "Program not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const acceptedSubmissionDocumentId =
    requiredString(body?.acceptedSubmissionDocumentId) || approval.documentId;
  const signedApprovalDocumentId = requiredString(body?.signedApprovalDocumentId);

  if (!acceptedSubmissionDocumentId) {
    return businessRuleResponse("reviewedDocumentRequired");
  }

  if (!signedApprovalDocumentId) {
    return businessRuleResponse("signedApprovalPdfRequired");
  }

  try {
    await acknowledgeApproval({
      user: session.user,
      program,
      approval,
    });

    const result = await acknowledgeSignedApprovalFlow({
      deliverableId: approval.deliverableId,
      acceptedSubmissionDocumentId,
      signedApprovalDocumentId,
      approvalId: approval.id,
      acknowledgedByEmail: session.user.email ?? "",
      acknowledgedByName: session.user.name ?? session.user.email ?? "Signed-in user",
      acknowledgedByUserId: session.user.id,
    });

    if (result.skipped) {
      await createDocumentAccessLog({
        documentId: signedApprovalDocumentId,
        programId: approval.programId,
        actorUserId: session.user.id,
        actorName: session.user.name ?? session.user.email ?? "Signed-in user",
        actorEmail: session.user.email ?? "",
        action: "Acknowledge",
        source: "Web App",
      });
    }

    return NextResponse.json({
      acknowledged: true,
      flowSkipped: result.skipped,
    });
  } catch (error) {
    return errorResponse(error, {
      fallback: "Failed to acknowledge signed approval.",
    });
  }
}
