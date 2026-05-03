import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Program } from "@/lib/models/program";
import type { EffectiveRole, InternalRole } from "@/lib/auth/roles";
import { hasAnyRole, normalizeEmail } from "@/lib/auth/roles";

export async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return session.user;
}

export async function requireInternalRole(allowedRoles: readonly InternalRole[]) {
  const user = await requireUser();

  if (!hasAnyRole(user.internalRoles, allowedRoles)) {
    redirect("/unauthorized");
  }

  return user;
}

export function getEffectiveRolesForProgram(
  user: { email?: string | null; internalRoles: InternalRole[] },
  program?: Program
): EffectiveRole[] {
  const roles = new Set<EffectiveRole>();

  for (const role of user.internalRoles) {
    roles.add(role);
  }

  const userEmail = normalizeEmail(user.email);

  if (
    program?.access?.some(
      (entry) => normalizeEmail(entry.email) === userEmail
    )
  ) {
    roles.add("gov-reviewer");
  }

  return [...roles];
}

export function canViewProgram(
  user: { email?: string | null; internalRoles: InternalRole[] },
  program: Program
) {
  if (user.internalRoles.includes("drg-admin")) return true;

  const userEmail = normalizeEmail(user.email);

  return program.access.some(
    (entry) => normalizeEmail(entry.email) === userEmail
  );
}

export function canManageProgramAccess(
  user: { email?: string | null; internalRoles: InternalRole[] },
  program: Program
) {
  if (user.internalRoles.includes("drg-admin")) return true;

  if (!user.internalRoles.includes("drg-program-owner")) {
    return false;
  }

  return canViewProgram(user, program);
}

export function assertCanViewProgram(
  user: { email?: string | null; internalRoles: InternalRole[] },
  program: Program | undefined
) {
  if (!program) notFound();

  if (!canViewProgram(user, program)) {
    redirect("/unauthorized");
  }
}
