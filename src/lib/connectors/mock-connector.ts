import type { UpdateEvent } from "@/lib/models/update-event";
import type { UpdateConnector } from "./types";

const MOCK_EVENTS: UpdateEvent[] = [
  {
    id: "evt-001",
    source: "sharepoint",
    department: "engineering",
    title: "CDRL-001 Software Development Plan uploaded",
    summary: "John Smith uploaded SDP_v2.1_Draft.docx to the CDRL Document Library.",
    updatedBy: "John Smith",
    updatedAt: "2026-02-16T09:15:00Z",
    resourceUrl: "https://drg.sharepoint.com/sites/contracts/cdrl-library/SDP_v2.1_Draft.docx",
  },
  {
    id: "evt-002",
    source: "power-bi",
    department: "finance",
    title: "Deliverable Status dashboard refreshed",
    summary: "The Deliverable Status report completed its scheduled data refresh.",
    updatedBy: "System",
    updatedAt: "2026-02-16T08:00:00Z",
    metadata: { reportId: "rpt-monthly-rev", status: "success" },
  },
  {
    id: "evt-003",
    source: "teams",
    department: "operations",
    title: "CDRL review feedback posted",
    summary: "Maria Garcia posted review comments on CDRL-003 Interface Design Description in #cdrl-reviews.",
    updatedBy: "Maria Garcia",
    updatedAt: "2026-02-16T10:05:00Z",
    resourceUrl: "https://teams.microsoft.com/l/message/cdrl-reviews/456",
  },
  {
    id: "evt-004",
    source: "power-automate",
    department: "hr",
    title: "SDRL approval workflow triggered",
    summary: "Approval workflow started for SDRL-002 Subcontractor Monthly Status Report.",
    updatedBy: "Power Automate",
    updatedAt: "2026-02-16T07:30:00Z",
    metadata: { flowId: "flow-onboard-001", employeeName: "Alex Johnson" },
  },
  {
    id: "evt-005",
    source: "dynamics",
    department: "operations",
    title: "CDRL-005 status changed to Approved",
    summary: "CDRL-005 Configuration Management Plan moved from In Review to Approved by Mike Lee.",
    updatedBy: "Mike Lee",
    updatedAt: "2026-02-15T16:45:00Z",
    metadata: { workOrderId: "WO-4521", newStatus: "Completed" },
  },
  {
    id: "evt-006",
    source: "sharepoint",
    department: "marketing",
    title: "Training Plan document updated",
    summary: "Sarah Chen updated CDRL-007_Training_Plan_v1.2.pdf in the CDRL Document Library.",
    updatedBy: "Sarah Chen",
    updatedAt: "2026-02-15T14:20:00Z",
    resourceUrl: "https://drg.sharepoint.com/sites/contracts/cdrl-library/CDRL-007_Training_Plan_v1.2.pdf",
  },
  {
    id: "evt-007",
    source: "power-bi",
    department: "engineering",
    title: "Contract deliverables dashboard refreshed",
    summary: "Contract Deliverables Tracking dashboard refreshed with latest Dataverse data.",
    updatedBy: "System",
    updatedAt: "2026-02-15T12:00:00Z",
    metadata: { reportId: "rpt-sprint-velocity", status: "success" },
  },
  {
    id: "evt-008",
    source: "teams",
    department: "general",
    title: "Deliverable review meeting scheduled",
    summary: "Dana Park scheduled the CDRL/SDRL quarterly review meeting for 2026-02-20 at 2:00 PM.",
    updatedBy: "Dana Park",
    updatedAt: "2026-02-15T11:00:00Z",
  },
];

export class MockConnector implements UpdateConnector {
  readonly name = "Mock";

  async getUpdates(): Promise<UpdateEvent[]> {
    return MOCK_EVENTS;
  }
}

export { MOCK_EVENTS };
