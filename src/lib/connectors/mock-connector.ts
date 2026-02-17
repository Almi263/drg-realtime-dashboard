import type { UpdateEvent } from "@/lib/models/update-event";
import type { UpdateConnector } from "./types";

const MOCK_EVENTS: UpdateEvent[] = [
  {
    id: "evt-001",
    source: "sharepoint",
    department: "engineering",
    title: "Q1 Architecture Review uploaded",
    summary: "John Smith uploaded Q1 Architecture Review.pptx to the Engineering shared drive.",
    updatedBy: "John Smith",
    updatedAt: "2026-02-16T09:15:00Z",
    resourceUrl: "https://contoso.sharepoint.com/sites/eng/docs/q1-arch-review.pptx",
  },
  {
    id: "evt-002",
    source: "power-bi",
    department: "finance",
    title: "Monthly Revenue dashboard refreshed",
    summary: "The Monthly Revenue report completed its scheduled data refresh.",
    updatedBy: "System",
    updatedAt: "2026-02-16T08:00:00Z",
    metadata: { reportId: "rpt-monthly-rev", status: "success" },
  },
  {
    id: "evt-003",
    source: "teams",
    department: "operations",
    title: "Ops standup notes posted",
    summary: "Maria Garcia posted the daily standup summary in #ops-standup.",
    updatedBy: "Maria Garcia",
    updatedAt: "2026-02-16T10:05:00Z",
    resourceUrl: "https://teams.microsoft.com/l/message/ops-standup/123",
  },
  {
    id: "evt-004",
    source: "power-automate",
    department: "hr",
    title: "New hire onboarding flow triggered",
    summary: "Onboarding workflow started for new hire Alex Johnson (start date 2026-02-24).",
    updatedBy: "Power Automate",
    updatedAt: "2026-02-16T07:30:00Z",
    metadata: { flowId: "flow-onboard-001", employeeName: "Alex Johnson" },
  },
  {
    id: "evt-005",
    source: "dynamics",
    department: "operations",
    title: "Work order WO-4521 status changed",
    summary: "Work order WO-4521 moved from In Progress to Completed by Mike Lee.",
    updatedBy: "Mike Lee",
    updatedAt: "2026-02-15T16:45:00Z",
    metadata: { workOrderId: "WO-4521", newStatus: "Completed" },
  },
  {
    id: "evt-006",
    source: "sharepoint",
    department: "marketing",
    title: "Brand guidelines updated",
    summary: "Sarah Chen updated Brand-Guidelines-2026.pdf in the Marketing library.",
    updatedBy: "Sarah Chen",
    updatedAt: "2026-02-15T14:20:00Z",
    resourceUrl: "https://contoso.sharepoint.com/sites/mktg/docs/brand-guidelines-2026.pdf",
  },
  {
    id: "evt-007",
    source: "power-bi",
    department: "engineering",
    title: "Sprint velocity report refreshed",
    summary: "Sprint Velocity dashboard refreshed with latest data from Jira sync.",
    updatedBy: "System",
    updatedAt: "2026-02-15T12:00:00Z",
    metadata: { reportId: "rpt-sprint-velocity", status: "success" },
  },
  {
    id: "evt-008",
    source: "teams",
    department: "general",
    title: "All-hands meeting scheduled",
    summary: "Dana Park scheduled the February all-hands meeting for 2026-02-20 at 2:00 PM.",
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
