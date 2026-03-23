export interface Program {
  id: string;
  name: string;
  contractRef: string;
  description: string;
  sites: string[];
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
}
