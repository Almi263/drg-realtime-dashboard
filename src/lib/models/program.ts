export const PROGRAM_STATUSES = [
  "Draft",
  "Active",
  "On Hold",
  "Closed",
  "Archived",
] as const;
export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];

export const PROGRAM_ACCESS_ROLES = [
  "Program Owner",
  "DRG Staff",
  "External Reviewer",
  "Read Only",
] as const;
export type ProgramAccessRole = (typeof PROGRAM_ACCESS_ROLES)[number];

export interface ProgramSite {
  id: string;
  programId: string;
  name: string;
  siteCode?: string;
  region?: string;
  isPrimary: boolean;
}

export interface ProgramAccess {
  id: string;
  programId: string;
  userId?: string;
  email: string;
  accessRole: ProgramAccessRole;
  isActive: boolean;
  grantedAt: string;
  grantedByEmail: string;
  revokedAt?: string;
  revokedByEmail?: string;
  entraObjectId?: string;
}

export interface Program {
  id: string;
  name: string;
  programNumber: string;
  contractRef: string;
  description: string;
  sites: ProgramSite[];
  status: ProgramStatus;
  startDate: string;
  endDate: string;
  creatorUserId?: string;
  creatorUpn: string;
  ownerUserId?: string;
  ownerUpn: string;
  primarySiteCount: number;
  archivedByUserId?: string;
  archivedOn?: string;
  createdAt: string;
  access: ProgramAccess[];
}
