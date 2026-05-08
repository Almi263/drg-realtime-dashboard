import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canDeleteDocument } from "@/lib/auth/guards";
import {
  deleteDocumentMetadata,
  getVisibleDocumentById,
} from "@/lib/dataverse/documents";
import { getProgramById } from "@/lib/dataverse/programs";
import { errorResponse } from "@/lib/errors/business-rules";
import {
  deleteSharePointFile,
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

  const { id } = await params;

  try {
    const document = await getVisibleDocumentById(id, session.user);
    if (!document) {
      return NextResponse.json(
        { error: "Document not found or not accessible." },
        { status: 404 }
      );
    }

    const program = await getProgramById(document.programId, session.user);
    if (!program) {
      return NextResponse.json(
        { error: "Program not found or not accessible." },
        { status: 404 }
      );
    }

    if (!canDeleteDocument(session.user, program)) {
      return NextResponse.json(
        { error: "Only DRG admins or this program's owner can delete documents." },
        { status: 403 }
      );
    }

    if (
      isSharePointUploadConfigured() &&
      document.sharePointDriveId &&
      document.sharePointItemId
    ) {
      await deleteSharePointFile({
        driveId: document.sharePointDriveId,
        itemId: document.sharePointItemId,
      });
    }

    await deleteDocumentMetadata(document.id);

    return NextResponse.json({
      deleted: true,
      documentId: document.id,
    });
  } catch (error) {
    return errorResponse(error, {
      fallback: "Failed to delete document.",
    });
  }
}
