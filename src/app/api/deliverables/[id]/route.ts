import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canCreateDeliverable, canDeleteDeliverable } from "@/lib/auth/guards";
import {
  deleteDeliverable,
  getVisibleDeliverableById,
  updateDeliverable,
} from "@/lib/dataverse/deliverables";
import { listDocumentIdsForDeliverable } from "@/lib/dataverse/documents";
import { getProgramById } from "@/lib/dataverse/programs";
import { businessRuleResponse, errorResponse } from "@/lib/errors/business-rules";
import {
  deleteDeliverableFolder,
  isSharePointUploadConfigured,
} from "@/lib/sharepoint/files";

function requiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const title = requiredString(body?.title);
  const dueDate = requiredString(body?.dueDate);

  if (!title || !dueDate) {
    return NextResponse.json(
      { error: "Title and due date are required." },
      { status: 400 }
    );
  }

  try {
    const deliverable = await getVisibleDeliverableById(id, session.user);
    if (!deliverable) {
      return NextResponse.json(
        { error: "Deliverable not found or not accessible." },
        { status: 404 }
      );
    }

    const program = await getProgramById(deliverable.programId, session.user);
    if (!program) {
      return NextResponse.json(
        { error: "Program not found or not accessible." },
        { status: 404 }
      );
    }

    if (!canCreateDeliverable(session.user, program)) {
      if (program.status === "Archived") {
        return businessRuleResponse("archivedProgramUploadBlocked");
      }

      return NextResponse.json(
        { error: "You do not have access to edit deliverables for this program." },
        { status: 403 }
      );
    }

    await updateDeliverable({
      deliverableId: deliverable.id,
      title,
      dueDate,
      description: requiredString(body?.description),
      assignedToEmail: requiredString(body?.assignedToEmail),
    });

    return NextResponse.json({ updated: true, deliverableId: deliverable.id });
  } catch (error) {
    return errorResponse(error, {
      fallback: "Failed to update deliverable.",
    });
  }
}

export async function DELETE(
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

    const program = await getProgramById(deliverable.programId, session.user);
    if (!program) {
      return NextResponse.json(
        { error: "Program not found or not accessible." },
        { status: 404 }
      );
    }

    const documentIds = await listDocumentIdsForDeliverable(deliverable.id);
    const isAdmin = session.user.internalRoles.includes("drg-admin");

    if (!canDeleteDeliverable(session.user, program, documentIds.length)) {
      if (
        session.user.internalRoles.includes("drg-program-owner") &&
        documentIds.length > 0
      ) {
        return businessRuleResponse("deliverableDeleteBlocked");
      }

      return NextResponse.json(
        {
          error:
            "Only DRG admins or this program's owner can delete deliverables.",
        },
        { status: 403 }
      );
    }

    if (isSharePointUploadConfigured()) {
      await deleteDeliverableFolder({
        programId: program.id,
        programNumber: program.programNumber,
        programName: program.name,
        deliverableId: deliverable.id,
        deliverableNumber: deliverable.deliverableNumber,
        deliverableName: deliverable.title,
      });
    }

    await deleteDeliverable({
      deliverableId: deliverable.id,
      forceWithDocuments: isAdmin,
    });

    return NextResponse.json({
      deleted: true,
      deliverableId: deliverable.id,
      deletedDocumentCount: isAdmin ? documentIds.length : 0,
    });
  } catch (error) {
    return errorResponse(error, {
      fallback: "Failed to delete deliverable.",
    });
  }
}
