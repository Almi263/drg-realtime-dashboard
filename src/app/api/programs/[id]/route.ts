import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canDeleteProgram } from "@/lib/auth/guards";
import { deleteEmptyProgram, getProgramById } from "@/lib/dataverse/programs";
import { errorResponse } from "@/lib/errors/business-rules";
import {
  deleteProgramFolder,
  isSharePointUploadConfigured,
} from "@/lib/sharepoint/files";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!canDeleteProgram(session.user)) {
    return NextResponse.json(
      { error: "Only DRG admins can delete programs." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const program = await getProgramById(id, session.user);

  if (!program) {
    return NextResponse.json(
      { error: "Program not found or not accessible." },
      { status: 404 }
    );
  }

  try {
    if (isSharePointUploadConfigured()) {
      await deleteProgramFolder({
        programNumber: program.programNumber,
        programName: program.name,
        legacyProgramId: id,
      });
    }

    await deleteEmptyProgram(id);
    return NextResponse.json({ deleted: true, programId: id });
  } catch (error) {
    return errorResponse(error, {
      fallback: "Failed to delete program.",
    });
  }
}
