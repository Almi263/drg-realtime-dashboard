import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listVisiblePrograms } from "@/lib/dataverse/programs";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const programs = await listVisiblePrograms(session.user);
  return NextResponse.json({ programs });
}
