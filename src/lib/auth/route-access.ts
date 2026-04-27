import type { Role } from "@/lib/context/role-context";

export const APP_ROUTES = [
  "/",
  "/programs",
  "/records",
  "/documents",
  "/calendar",
  "/submit",
] as const;

export type AppRoute = (typeof APP_ROUTES)[number];

export const ROUTE_ALLOWED_ROLES: Record<AppRoute, readonly Role[]> = {
  "/": ["drg-admin", "drg-staff", "gov-reviewer"],
  "/programs": ["drg-admin", "drg-staff", "gov-reviewer"],
  "/records": ["drg-admin", "drg-staff", "gov-reviewer"],
  "/documents": ["drg-admin", "drg-staff", "gov-reviewer"],
  "/calendar": ["drg-admin", "drg-staff", "gov-reviewer"],
  "/submit": ["drg-admin", "drg-staff"],
};

export function canRoleAccessRoute(role: Role, route: AppRoute): boolean {
  return ROUTE_ALLOWED_ROLES[route].includes(role);
}
