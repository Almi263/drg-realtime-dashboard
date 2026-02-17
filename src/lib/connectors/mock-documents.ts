import type { DeliverableDocument } from "@/lib/models/document";

const MOCK_DOCUMENTS: DeliverableDocument[] = [
  {
    id: "doc-001",
    fileName: "SDP_v2.1_Draft.docx",
    fileType: "Word",
    deliverableId: "CDRL-001",
    uploadedBy: "John Smith",
    uploadedAt: "2026-02-16T09:15:00Z",
    status: "Draft",
    sizeKb: 2450,
  },
  {
    id: "doc-002",
    fileName: "Test_Results_Sprint4.xlsx",
    fileType: "Excel",
    deliverableId: "CDRL-002",
    uploadedBy: "Maria Garcia",
    uploadedAt: "2026-02-15T14:30:00Z",
    status: "Under Review",
    sizeKb: 1870,
  },
  {
    id: "doc-003",
    fileName: "IDD_External_Interfaces_v1.0.pdf",
    fileType: "PDF",
    deliverableId: "CDRL-003",
    uploadedBy: "David Torres",
    uploadedAt: "2026-02-12T11:00:00Z",
    status: "Draft",
    sizeKb: 3200,
  },
  {
    id: "doc-004",
    fileName: "SVD_Release_3.2.docx",
    fileType: "Word",
    deliverableId: "CDRL-004",
    uploadedBy: "Rachel Kim",
    uploadedAt: "2026-02-14T16:00:00Z",
    status: "Final",
    sizeKb: 1540,
  },
  {
    id: "doc-005",
    fileName: "CM_Plan_v2.0_Review.docx",
    fileType: "Word",
    deliverableId: "CDRL-005",
    uploadedBy: "Mike Lee",
    uploadedAt: "2026-02-15T16:45:00Z",
    status: "Under Review",
    sizeKb: 980,
  },
  {
    id: "doc-006",
    fileName: "CDRL-007_Training_Plan_v1.2.pdf",
    fileType: "PDF",
    deliverableId: "CDRL-007",
    uploadedBy: "Sarah Chen",
    uploadedAt: "2026-02-15T14:20:00Z",
    status: "Draft",
    sizeKb: 4100,
  },
  {
    id: "doc-007",
    fileName: "Monthly_Status_Feb2026.pptx",
    fileType: "PowerPoint",
    deliverableId: "SDRL-002",
    uploadedBy: "Sarah Chen",
    uploadedAt: "2026-02-16T07:30:00Z",
    status: "Final",
    sizeKb: 5600,
  },
  {
    id: "doc-008",
    fileName: "SRS_Requirements_Matrix.xlsx",
    fileType: "Excel",
    deliverableId: "CDRL-006",
    uploadedBy: "David Torres",
    uploadedAt: "2026-02-09T10:30:00Z",
    status: "Draft",
    sizeKb: 2100,
  },
];

export class MockDocumentConnector {
  readonly name = "MockDocuments";

  async getDocuments(): Promise<DeliverableDocument[]> {
    return MOCK_DOCUMENTS;
  }
}

export { MOCK_DOCUMENTS };
