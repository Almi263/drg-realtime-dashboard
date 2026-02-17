export const UPDATE_SOURCES = [
  "teams",
  "power-bi",
  "power-automate",
  "dynamics",
  "sharepoint",
] as const;

export type UpdateSource = (typeof UPDATE_SOURCES)[number];

export const DEPARTMENTS = [
  "engineering",
  "operations",
  "finance",
  "hr",
  "marketing",
  "general",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export interface UpdateEvent {
  id: string;
  source: UpdateSource;
  department: Department;
  title: string;
  summary: string;
  updatedBy: string;
  updatedAt: string; // ISO 8601
  resourceUrl?: string;
  metadata?: Record<string, string>;
}
