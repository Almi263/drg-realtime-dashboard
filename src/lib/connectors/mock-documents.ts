// Mock connector. Access logs on each document show who viewed/downloaded
// and when, which is the data behind the audit trail feature.
import type { DeliverableDocument } from "@/lib/models/document";

const MOCK_DOCUMENTS = [
  {
    id: "doc-001",
    fileName: "SDP_v2.1_Draft.docx",
    fileType: "Word",
    deliverableId: "CDRL-001",
    programId: "PROG-001",
    uploadedBy: "John Smith",
    uploadedAt: "2026-02-16T09:15:00Z",
    status: "Draft",
    sizeKb: 2450,
    accessLog: [
      { userId: "u-jsmith", userName: "John Smith", action: "viewed", timestamp: "2026-02-16T09:20:00Z" },
      { userId: "u-dtorres", userName: "David Torres", action: "viewed", timestamp: "2026-02-16T11:05:00Z" },
      { userId: "u-gov-lmartinez", userName: "L. Martinez (NAVSEA)", action: "viewed", timestamp: "2026-02-17T08:30:00Z" },
      { userId: "u-gov-lmartinez", userName: "L. Martinez (NAVSEA)", action: "downloaded", timestamp: "2026-02-17T08:31:00Z" },
    ],
  },
  {
    id: "doc-002",
    fileName: "Test_Results_Sprint4.xlsx",
    fileType: "Excel",
    deliverableId: "CDRL-002",
    programId: "PROG-001",
    uploadedBy: "Maria Garcia",
    uploadedAt: "2026-02-15T14:30:00Z",
    status: "Under Review",
    sizeKb: 1870,
    accessLog: [
      { userId: "u-mgarcia", userName: "Maria Garcia", action: "viewed", timestamp: "2026-02-15T14:35:00Z" },
      { userId: "u-gov-rcoleman", userName: "R. Coleman (DoD Review)", action: "viewed", timestamp: "2026-02-16T09:00:00Z" },
    ],
  },
  {
    id: "doc-003",
    fileName: "IDD_External_Interfaces_v1.0.pdf",
    fileType: "PDF",
    deliverableId: "CDRL-003",
    programId: "PROG-001",
    uploadedBy: "David Torres",
    uploadedAt: "2026-02-12T11:00:00Z",
    status: "Draft",
    sizeKb: 3200,
    accessLog: [
      { userId: "u-dtorres", userName: "David Torres", action: "viewed", timestamp: "2026-02-12T11:05:00Z" },
    ],
  },
  {
    id: "doc-004",
    fileName: "SVD_Release_3.2_Final.pdf",
    fileType: "PDF",
    deliverableId: "CDRL-004",
    programId: "PROG-001",
    uploadedBy: "Rachel Kim",
    uploadedAt: "2026-02-14T16:00:00Z",
    status: "Final",
    sizeKb: 1540,
    accessLog: [
      { userId: "u-rkim", userName: "Rachel Kim", action: "viewed", timestamp: "2026-02-14T16:10:00Z" },
      { userId: "u-jsmith", userName: "John Smith", action: "viewed", timestamp: "2026-02-14T17:00:00Z" },
      { userId: "u-gov-lmartinez", userName: "L. Martinez (NAVSEA)", action: "viewed", timestamp: "2026-02-15T08:00:00Z" },
      { userId: "u-gov-lmartinez", userName: "L. Martinez (NAVSEA)", action: "downloaded", timestamp: "2026-02-15T08:02:00Z" },
      { userId: "u-gov-rcoleman", userName: "R. Coleman (DoD Review)", action: "viewed", timestamp: "2026-02-15T10:15:00Z" },
      { userId: "u-gov-rcoleman", userName: "R. Coleman (DoD Review)", action: "downloaded", timestamp: "2026-02-15T10:16:00Z" },
    ],
  },
  {
    id: "doc-005",
    fileName: "CM_Plan_v2.0_Review.pdf",
    fileType: "PDF",
    deliverableId: "CDRL-005",
    programId: "PROG-001",
    uploadedBy: "Mike Lee",
    uploadedAt: "2026-02-15T16:45:00Z",
    status: "Under Review",
    sizeKb: 980,
    accessLog: [
      { userId: "u-mlee", userName: "Mike Lee", action: "viewed", timestamp: "2026-02-15T16:50:00Z" },
      { userId: "u-gov-lmartinez", userName: "L. Martinez (NAVSEA)", action: "viewed", timestamp: "2026-02-16T09:10:00Z" },
    ],
  },
  {
    id: "doc-006",
    fileName: "SRS_Requirements_Matrix.xlsx",
    fileType: "Excel",
    deliverableId: "CDRL-006",
    programId: "PROG-001",
    uploadedBy: "David Torres",
    uploadedAt: "2026-02-09T10:30:00Z",
    status: "Draft",
    sizeKb: 2100,
    accessLog: [],
  },
  {
    id: "doc-007",
    fileName: "Monthly_Status_Feb2026_Final.pdf",
    fileType: "PDF",
    deliverableId: "SDRL-002",
    programId: "PROG-001",
    uploadedBy: "Sarah Chen",
    uploadedAt: "2026-02-16T07:30:00Z",
    status: "Final",
    sizeKb: 5600,
    accessLog: [
      { userId: "u-schen", userName: "Sarah Chen", action: "viewed", timestamp: "2026-02-16T07:35:00Z" },
      { userId: "u-gov-lmartinez", userName: "L. Martinez (NAVSEA)", action: "viewed", timestamp: "2026-02-16T14:00:00Z" },
      { userId: "u-gov-lmartinez", userName: "L. Martinez (NAVSEA)", action: "downloaded", timestamp: "2026-02-16T14:01:00Z" },
      { userId: "u-gov-jwilliams", userName: "J. Williams (NOC)", action: "viewed", timestamp: "2026-02-17T09:00:00Z" },
      { userId: "u-gov-jwilliams", userName: "J. Williams (NOC)", action: "downloaded", timestamp: "2026-02-17T09:01:00Z" },
    ],
  },
  // ── PROG-002: RATS EDMS ──────────────────────────────────────────────
  {
    id: "doc-008",
    fileName: "CDRL-007_Training_Plan_v1.2.pdf",
    fileType: "PDF",
    deliverableId: "CDRL-007",
    programId: "PROG-002",
    uploadedBy: "Sarah Chen",
    uploadedAt: "2026-02-15T14:20:00Z",
    status: "Draft",
    sizeKb: 4100,
    accessLog: [
      { userId: "u-schen", userName: "Sarah Chen", action: "viewed", timestamp: "2026-02-15T14:25:00Z" },
    ],
  },
  {
    id: "doc-009",
    fileName: "SPS_v1.0_Approved.pdf",
    fileType: "PDF",
    deliverableId: "CDRL-008",
    programId: "PROG-002",
    uploadedBy: "Rachel Kim",
    uploadedAt: "2026-02-13T09:45:00Z",
    status: "Final",
    sizeKb: 3800,
    accessLog: [
      { userId: "u-rkim", userName: "Rachel Kim", action: "viewed", timestamp: "2026-02-13T09:50:00Z" },
      { userId: "u-gov-abrown", userName: "A. Brown (AFSC)", action: "viewed", timestamp: "2026-02-14T10:00:00Z" },
      { userId: "u-gov-abrown", userName: "A. Brown (AFSC)", action: "downloaded", timestamp: "2026-02-14T10:01:00Z" },
    ],
  },
  {
    id: "doc-010",
    fileName: "Site_Activity_Feb2026_Tinker.pdf",
    fileType: "PDF",
    deliverableId: "SDRL-003",
    programId: "PROG-002",
    uploadedBy: "Mike Lee",
    uploadedAt: "2026-02-04T15:10:00Z",
    status: "Final",
    sizeKb: 2750,
    accessLog: [
      { userId: "u-mlee", userName: "Mike Lee", action: "viewed", timestamp: "2026-02-04T15:15:00Z" },
      { userId: "u-gov-abrown", userName: "A. Brown (AFSC)", action: "viewed", timestamp: "2026-02-05T08:30:00Z" },
      { userId: "u-gov-abrown", userName: "A. Brown (AFSC)", action: "downloaded", timestamp: "2026-02-05T08:31:00Z" },
    ],
  },
  // ── PROG-003: Cyber Security Training ───────────────────────────────
  {
    id: "doc-011",
    fileName: "Cyber_Training_Curriculum_v3.pdf",
    fileType: "PDF",
    deliverableId: "CDRL-009",
    programId: "PROG-003",
    uploadedBy: "Dana Park",
    uploadedAt: "2026-02-20T10:00:00Z",
    status: "Final",
    sizeKb: 6200,
    accessLog: [
      { userId: "u-dpark", userName: "Dana Park", action: "viewed", timestamp: "2026-02-20T10:05:00Z" },
      { userId: "u-gov-tlee", userName: "T. Lee (DoD CIO)", action: "viewed", timestamp: "2026-02-21T09:00:00Z" },
      { userId: "u-gov-tlee", userName: "T. Lee (DoD CIO)", action: "downloaded", timestamp: "2026-02-21T09:02:00Z" },
    ],
  },
  {
    id: "doc-012",
    fileName: "Q1_2026_Compliance_Draft.docx",
    fileType: "Word",
    deliverableId: "CDRL-010",
    programId: "PROG-003",
    uploadedBy: "Dana Park",
    uploadedAt: "2026-02-28T09:30:00Z",
    status: "Under Review",
    sizeKb: 1450,
    accessLog: [
      { userId: "u-dpark", userName: "Dana Park", action: "viewed", timestamp: "2026-02-28T09:35:00Z" },
    ],
  },
] as unknown as DeliverableDocument[];

export class MockDocumentConnector {
  readonly name = "MockDocuments";

  async getDocuments(): Promise<DeliverableDocument[]> {
    return MOCK_DOCUMENTS;
  }
}

export { MOCK_DOCUMENTS };
