import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canApproveDeliverableDraft } from "@/lib/auth/guards";
import {
  approveDeliverableDraft,
  getVisibleDeliverableById,
} from "@/lib/dataverse/deliverables";
import { getProgramById } from "@/lib/dataverse/programs";
import { businessRuleResponse, errorResponse } from "@/lib/errors/business-rules";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deliverable = await getVisibleDeliverableById(id, session.user);
    if (!deliverable) {
      return NextResponse.json(
        { error: "Deliverable not found or not accessible." },
        { status: 404 }
      );
    }

    if (deliverable.status !== "Draft") {
      return NextResponse.json(
        { error: "Only draft deliverables can be approved." },
        { status: 400 }
      );
    }

    const program = await getProgramById(deliverable.programId, session.user);
    if (!program) {
      return NextResponse.json(
        { error: "Program not found or not accessible." },
        { status: 404 }
      );
    }

    if (program.status === "Archived") {
      return businessRuleResponse("archivedProgramUploadBlocked");
    }

    if (!canApproveDeliverableDraft(session.user, program)) {
      return NextResponse.json(
        { error: "Only DRG admins and this program's owner can approve deliverable drafts." },
        { status: 403 }
      );
    }

    await approveDeliverableDraft(deliverable.id);

    return NextResponse.json({
      deliverableId: deliverable.id,
      approved: true,
      status: "Not Submitted",
    });
  } catch (error) {
    return errorResponse(error, {
      fallback: "Failed to approve deliverable draft.",
    });
  }
}
