import type { Deliverable } from "@/lib/models/deliverable";

const MOCK_DELIVERABLES: Deliverable[] = [
  {
    id: "CDRL-001",
    title: "Software Development Plan (SDP)",
    type: "CDRL",
    status: "In Review",
    dueDate: "2026-02-19T17:00:00Z",
    assignedTo: "John Smith",
    contractRef: "FA8532-25-C-0042",
    description:
      "Describes the developer's plans for conducting a software development effort. Covers development methods, tools, standards, and schedule.",
    lastUpdated: "2026-02-16T09:15:00Z",
  },
  {
    id: "CDRL-002",
    title: "Software Test Plan (STP)",
    type: "CDRL",
    status: "Draft",
    dueDate: "2026-02-20T17:00:00Z",
    assignedTo: "Maria Garcia",
    contractRef: "FA8532-25-C-0042",
    description:
      "Describes the test planning, test procedures, and test environment for qualification testing of the software.",
    lastUpdated: "2026-02-15T14:30:00Z",
  },
  {
    id: "CDRL-003",
    title: "Interface Design Description (IDD)",
    type: "CDRL",
    status: "Overdue",
    dueDate: "2026-02-14T17:00:00Z",
    assignedTo: "David Torres",
    contractRef: "FA8532-25-C-0042",
    description:
      "Describes the interface characteristics of one or more systems, subsystems, or configuration items. Includes data element definitions and message formats.",
    lastUpdated: "2026-02-12T11:00:00Z",
  },
  {
    id: "CDRL-004",
    title: "Software Version Description (SVD)",
    type: "CDRL",
    status: "Approved",
    dueDate: "2026-02-25T17:00:00Z",
    assignedTo: "Rachel Kim",
    contractRef: "FA8532-25-C-0042",
    description:
      "Identifies and describes a software version consisting of one or more computer software configuration items.",
    lastUpdated: "2026-02-14T16:00:00Z",
  },
  {
    id: "CDRL-005",
    title: "Configuration Management Plan",
    type: "CDRL",
    status: "In Review",
    dueDate: "2026-02-18T17:00:00Z",
    assignedTo: "Mike Lee",
    contractRef: "FA8532-25-C-0042",
    description:
      "Describes the configuration management activities, procedures, and schedule for the contracted effort.",
    lastUpdated: "2026-02-15T16:45:00Z",
  },
  {
    id: "SDRL-001",
    title: "System/Subsystem Design Description (SSDD)",
    type: "SDRL",
    status: "Draft",
    dueDate: "2026-02-27T17:00:00Z",
    assignedTo: "John Smith",
    contractRef: "FA8532-25-C-0042",
    description:
      "Describes the system-wide design decisions and the architectural design of the system or subsystem.",
    lastUpdated: "2026-02-16T08:00:00Z",
  },
  {
    id: "SDRL-002",
    title: "Subcontractor Monthly Status Report",
    type: "SDRL",
    status: "Submitted",
    dueDate: "2026-02-28T17:00:00Z",
    assignedTo: "Sarah Chen",
    contractRef: "FA8532-25-C-0042",
    description:
      "Monthly report summarizing subcontractor progress, issues, risks, and financial status against the contracted effort.",
    lastUpdated: "2026-02-16T07:30:00Z",
  },
  {
    id: "CDRL-006",
    title: "Software Requirements Specification (SRS)",
    type: "CDRL",
    status: "Overdue",
    dueDate: "2026-02-10T17:00:00Z",
    assignedTo: "David Torres",
    contractRef: "FA8532-25-C-0042",
    description:
      "Specifies the requirements for a software system or subsystem, including functional, performance, interface, and design constraint requirements.",
    lastUpdated: "2026-02-09T10:30:00Z",
  },
  {
    id: "CDRL-007",
    title: "Training Plan",
    type: "CDRL",
    status: "Draft",
    dueDate: "2026-03-15T17:00:00Z",
    assignedTo: "Sarah Chen",
    contractRef: "FA8532-25-C-0042",
    description:
      "Describes the training program for operator and maintenance personnel, including curriculum, schedule, and resource requirements.",
    lastUpdated: "2026-02-15T14:20:00Z",
  },
  {
    id: "CDRL-008",
    title: "Software Product Specification (SPS)",
    type: "CDRL",
    status: "Approved",
    dueDate: "2026-03-20T17:00:00Z",
    assignedTo: "Rachel Kim",
    contractRef: "FA8532-25-C-0042",
    description:
      "Contains the executable software, source files, and associated documentation needed to compile, build, and integrate the software.",
    lastUpdated: "2026-02-13T09:45:00Z",
  },
];

export class MockDeliverableConnector {
  readonly name = "MockDeliverables";

  async getDeliverables(): Promise<Deliverable[]> {
    return MOCK_DELIVERABLES;
  }
}

export { MOCK_DELIVERABLES };
