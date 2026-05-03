import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canDownloadFromProgram } from "@/lib/auth/guards";
import { createDocumentAccessLog } from "@/lib/dataverse/document-access-logs";
import { getVisibleDocumentById } from "@/lib/dataverse/documents";
import { getProgramById } from "@/lib/dataverse/programs";
import { triggerFlow } from "@/lib/power-automate/flows";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const document = await getVisibleDocumentById(id, session.user);

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const program = await getProgramById(document.programId, session.user);

  if (!program || !canDownloadFromProgram(session.user, program)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!document.sharePointUrl) {
    return NextResponse.json(
      { error: "Document does not have a SharePoint download URL." },
      { status: 404 }
    );
  }

  await createDocumentAccessLog({
    documentId: document.id,
    programId: document.programId,
    actorUserId: session.user.id,
    actorName: session.user.name ?? session.user.email ?? "Signed-in user",
    actorEmail: session.user.email ?? "",
    action: "Download",
    source: "Web App",
  });

  await triggerFlow("documentDownloaded", {
    documentId: document.id,
    programId: document.programId,
    deliverableId: document.deliverableId,
    documentRole: document.documentRole,
    actorEmail: session.user.email,
    sharePointItemId: document.sharePointItemId,
  });

  return NextResponse.redirect(document.sharePointUrl);
}
