export const INTERNAL_ROLES = ["drg-admin", "drg-staff"] as const;
export const EFFECTIVE_ROLES = ["drg-admin", "drg-staff", "gov-reviewer"] as const;

export type InternalRole = (typeof INTERNAL_ROLES)[number];
export type EffectiveRole = (typeof EFFECTIVE_ROLES)[number];

export const ROLE_LABELS: Record<EffectiveRole, string> = {
  "drg-admin": "DRG Admin",
  "drg-staff": "DRG Staff",
  "gov-reviewer": "Gov Reviewer",
};

const ENTRA_APP_ROLE_TO_INTERNAL_ROLE: Record<string, InternalRole> = {
  "drg-admin": "drg-admin",
  "drg-staff": "drg-staff",
};

const ENTRA_GROUP_TO_INTERNAL_ROLE: Record<string, InternalRole> = {
  [process.env.ENTRA_DRG_ADMIN_GROUP_ID ?? ""]: "drg-admin",
  [process.env.ENTRA_DRG_STAFF_GROUP_ID ?? ""]: "drg-staff",
};

export function normalizeEmail(email: string | null | undefined) {
  return String(email ?? "").trim().toLowerCase();
}

export function mapClaimsToInternalRoles(claims: Record<string, unknown>): InternalRole[] {
  const roles = Array.isArray(claims.roles) ? claims.roles.map(String) : [];
  const groups = Array.isArray(claims.groups) ? claims.groups.map(String) : [];

  const mapped = new Set<InternalRole>();

  for (const role of roles) {
    const internalRole = ENTRA_APP_ROLE_TO_INTERNAL_ROLE[role];
    if (internalRole) mapped.add(internalRole);
  }

  for (const group of groups) {
    const internalRole = ENTRA_GROUP_TO_INTERNAL_ROLE[group];
    if (internalRole) mapped.add(internalRole);
  }

  return [...mapped];
}

export function hasAnyRole<T extends string>(
  actual: readonly T[],
  allowed: readonly T[]
) {
  return allowed.some((role) => actual.includes(role));
}
