import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canManageProgramAccess } from "@/lib/auth/guards";
import { normalizeEmail } from "@/lib/auth/roles";
import { MockProgramConnector } from "@/lib/connectors/mock-programs";
import { inviteExternalReviewer } from "@/lib/graph/invitations";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id: programId } = await params;
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const programs = await new MockProgramConnector().getPrograms();
  const program = programs.find((p) => p.id === programId);

  if (!program) {
    return NextResponse.json({ error: "Program not found." }, { status: 404 });
  }

  if (!canManageProgramAccess(session.user, program)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    await inviteExternalReviewer(email);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to invite reviewer.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    email,
    invited: true,
  });
}
