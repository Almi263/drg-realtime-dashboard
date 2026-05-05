import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canWorkProgram } from "@/lib/auth/guards";
import {
  createDeliverable,
  listVisibleDeliverables,
} from "@/lib/dataverse/deliverables";
import { listDeliverableTypes } from "@/lib/dataverse/deliverable-types";
import { getProgramById } from "@/lib/dataverse/programs";
import { businessRuleResponse, errorResponse } from "@/lib/errors/business-rules";
import {
  ensureDeliverableFolder,
  isSharePointUploadConfigured,
} from "@/lib/sharepoint/files";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const deliverables = await listVisibleDeliverables(session.user);
  return NextResponse.json({ deliverables });
}

function requiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const programId = requiredString(body?.programId);
  const title = requiredString(body?.title);
  const deliverableNumber = requiredString(body?.deliverableNumber);
  const typeId = requiredString(body?.typeId);
  const dueDate = requiredString(body?.dueDate);

  if (!programId || !title || !deliverableNumber || !typeId || !dueDate) {
    return NextResponse.json(
      {
        error:
          "Program, title, deliverable number, type, and due date are required.",
      },
      { status: 400 }
    );
  }

  try {
    const program = await getProgramById(programId, session.user);
    if (!program) {
      return NextResponse.json(
        { error: "Program not found or not accessible." },
        { status: 404 }
      );
    }

    if (!canWorkProgram(session.user, program)) {
      if (program.status === "Archived") {
        return businessRuleResponse("archivedProgramUploadBlocked");
      }

      return NextResponse.json(
        { error: "You do not have access to create deliverables for this program." },
        { status: 403 }
      );
    }

    const [existingDeliverables, deliverableTypes] = await Promise.all([
      listVisibleDeliverables(session.user),
      listDeliverableTypes(),
    ]);

    if (
      existingDeliverables.some(
        (deliverable) =>
          deliverable.programId === programId &&
          deliverable.deliverableNumber.trim().toLowerCase() ===
            deliverableNumber.toLowerCase()
      )
    ) {
      return businessRuleResponse("duplicateDeliverableNumber");
    }

    const deliverableType = deliverableTypes.find((type) => type.id === typeId);
    if (!deliverableType) {
      return NextResponse.json(
        { error: "Deliverable type not found or inactive." },
        { status: 400 }
      );
    }

    const deliverableId = await createDeliverable({
      programId,
      title,
      deliverableNumber,
      typeId,
      dueDate,
      contractRef: program.contractRef,
      description: requiredString(body?.description),
      assignedToEmail: requiredString(body?.assignedToEmail),
    });

    if (isSharePointUploadConfigured()) {
      await ensureDeliverableFolder({
        programId,
        programName: program.name,
        deliverableId,
        deliverableName: title,
      });
    }

    return NextResponse.json({ deliverableId, created: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error, {
      fallback: "Failed to create deliverable.",
      duplicateConflict: "duplicateDeliverableNumber",
    });
  }
}
