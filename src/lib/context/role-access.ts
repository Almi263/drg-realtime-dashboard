//This file acts as a centralized location for all role permissions across the DRG app.
//eventually this functionality will be checked serverside, since right now it's all handled 
//within local react files 

//Importing and App Route Setup

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

//Role permissions

export const ROUTE_ALLOWED_ROLES: Record<AppRoute, readonly Role[]> = {
  "/": ["drg-admin", "drg-staff", "gov-reviewer"],
  "/programs": ["drg-admin", "drg-staff", "gov-reviewer"],
  "/records": ["drg-admin", "drg-staff", "gov-reviewer"],
  "/documents": ["drg-admin", "drg-staff", "gov-reviewer"],
  "/calendar": ["drg-admin", "drg-staff", "gov-reviewer"],
  "/submit": ["drg-admin", "drg-staff"],
};

export const SUBMIT_ALLOWED_ROLES: readonly Role[] = ["drg-admin", "drg-staff"];
export const DOCUMENTS_UPLOAD_ALLOWED_ROLES: readonly Role[] = ["drg-admin", "drg-staff"];
export const DOCUMENTS_DELETE_ALLOWED_ROLES: readonly Role[] = ["drg-admin"];
export const DOCUMENTS_ACCESS_LOG_ALLOWED_ROLES: readonly Role[] = ["drg-admin", "drg-staff"];
export const DELIVERABLE_ACCESS_LOG_ALLOWED_ROLES: readonly Role[] = ["drg-admin", "drg-staff"];
export const DOCUMENT_ACCESS_NOTICE_ALLOWED_ROLES: readonly Role[] = ["gov-reviewer"];

//Access functions

export function canRoleAccessRoute(role: Role, route: AppRoute): boolean {
  return ROUTE_ALLOWED_ROLES[route].includes(role);
}

export function canRoleSubmit(role: Role): boolean {
  return SUBMIT_ALLOWED_ROLES.includes(role);
}

export function canRoleUploadDocuments(role: Role): boolean {
  return DOCUMENTS_UPLOAD_ALLOWED_ROLES.includes(role);
}

export function canRoleDeleteDocuments(role: Role): boolean {
  return DOCUMENTS_DELETE_ALLOWED_ROLES.includes(role);
}

export function canRoleViewDocumentAccessLog(role: Role): boolean {
  return DOCUMENTS_ACCESS_LOG_ALLOWED_ROLES.includes(role);
}

export function canRoleViewDeliverableAccessLog(role: Role): boolean {
  return DELIVERABLE_ACCESS_LOG_ALLOWED_ROLES.includes(role);
}

export function shouldRoleSeeDocumentAccessNotice(role: Role): boolean {
  return DOCUMENT_ACCESS_NOTICE_ALLOWED_ROLES.includes(role);
}