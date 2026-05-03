import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canUploadToProgram } from "@/lib/auth/guards";
import { createDocumentAccessLog } from "@/lib/dataverse/document-access-logs";
import { getVisibleDeliverableById } from "@/lib/dataverse/deliverables";
import { createDocumentMetadata } from "@/lib/dataverse/documents";
import { getProgramById } from "@/lib/dataverse/programs";
import { uploadPdfToSharePoint } from "@/lib/sharepoint/files";
import { triggerFlow } from "@/lib/power-automate/flows";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const deliverableId = String(formData?.get("deliverableId") ?? "");
  const programId = String(formData?.get("programId") ?? "");
  const reviewDueDate = String(formData?.get("reviewDueDate") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
  }

  if (
    file.type !== "application/pdf" ||
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return NextResponse.json({ error: "Only PDF files can be uploaded." }, { status: 400 });
  }

  const deliverable = await getVisibleDeliverableById(deliverableId, session.user);
  const program = await getProgramById(programId, session.user);
  if (!deliverable || deliverable.programId !== programId) {
    return NextResponse.json(
      { error: "Deliverable not found or not accessible." },
      { status: 404 }
    );
  }

  if (!program || !canUploadToProgram(session.user, program)) {
    return NextResponse.json(
      {
        error:
          program?.status === "Archived"
            ? "This program is archived. Downloads remain available, but new uploads are blocked."
            : "You do not have access to upload documents for this program.",
      },
      { status: 403 }
    );
  }

  try {
    const content = await file.arrayBuffer();
    const sharePointFile = await uploadPdfToSharePoint({
      programId,
      deliverableId,
      fileName: file.name,
      content,
    });

    const documentId = await createDocumentMetadata({
      programId,
      deliverableId,
      fileName: file.name,
      sizeKb: sharePointFile.sizeKb || Math.ceil(file.size / 1024),
      uploadedByEmail: session.user.email ?? "",
      sharePointSiteUrl: sharePointFile.siteUrl,
      sharePointDriveId: sharePointFile.driveId,
      sharePointItemId: sharePointFile.itemId,
      sharePointUrl: sharePointFile.webUrl,
      documentRole: "DRG Submission",
      reviewDueDate,
    });

    await createDocumentAccessLog({
      documentId,
      programId,
      actorUserId: session.user.id,
      actorName: session.user.name ?? session.user.email ?? "Signed-in user",
      actorEmail: session.user.email ?? "",
      action: "Upload",
      source: "Web App",
    });

    await triggerFlow("submissionCreated", {
      programId,
      deliverableId,
      fileName: file.name,
      uploadedByEmail: session.user.email,
      sharePointItemId: sharePointFile.itemId,
      reviewDueDate,
    });

    return NextResponse.json({
      submitted: true,
      documentId,
      submissionRef: sharePointFile.itemId,
      sharePointUrl: sharePointFile.webUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit document.",
      },
      { status: 500 }
    );
  }
}
