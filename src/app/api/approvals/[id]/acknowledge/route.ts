import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { acknowledgeApproval, getApprovalById } from "@/lib/dataverse/approvals";
import { getProgramById } from "@/lib/dataverse/programs";
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

  if (!signedApprovalDocumentId) {
    return NextResponse.json(
      { error: "Signed approval document ID is required." },
      { status: 400 }
    );
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
    });

    return NextResponse.json({
      acknowledged: true,
      flowSkipped: result.skipped,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to acknowledge signed approval.",
      },
      { status: 500 }
    );
  }
}
