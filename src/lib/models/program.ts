export interface ProgramAccessGrant {
  email: string;
  grantedAt: string; // ISO 8601
  grantedByEmail: string;
}

export interface Program {
  id: string;
  name: string;
  contractRef: string;
  description: string;
  sites: string[];
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  creatorEmail: string;
  createdAt: string; // ISO 8601
  accessList: ProgramAccessGrant[];
}
