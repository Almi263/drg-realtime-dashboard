// Mock connector. Statuses and due dates are set to produce a realistic
// dashboard with some items overdue and others in review.
import type { Deliverable } from "@/lib/models/deliverable";

const MOCK_DELIVERABLES: Deliverable[] = [
  // ── PROG-001: Surface Communications ────────────────────────────────
  {
    id: "CDRL-001",
    title: "Software Development Plan (SDP)",
    type: "CDRL",
    status: "In Review",
    dueDate: "2026-02-19T17:00:00Z",
    assignedTo: "John Smith",
    programId: "PROG-001",
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
    programId: "PROG-001",
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
    programId: "PROG-001",
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
    programId: "PROG-001",
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
    programId: "PROG-001",
    contractRef: "FA8532-25-C-0042",
    description:
      "Describes the configuration management activities, procedures, and schedule for the contracted effort.",
    lastUpdated: "2026-02-15T16:45:00Z",
  },
  {
    id: "CDRL-006",
    title: "Software Requirements Specification (SRS)",
    type: "CDRL",
    status: "Overdue",
    dueDate: "2026-02-10T17:00:00Z",
    assignedTo: "David Torres",
    programId: "PROG-001",
    contractRef: "FA8532-25-C-0042",
    description:
      "Specifies the requirements for a software system or subsystem, including functional, performance, interface, and design constraint requirements.",
    lastUpdated: "2026-02-09T10:30:00Z",
  },
  {
    id: "SDRL-001",
    title: "System/Subsystem Design Description (SSDD)",
    type: "SDRL",
    status: "Draft",
    dueDate: "2026-02-27T17:00:00Z",
    assignedTo: "John Smith",
    programId: "PROG-001",
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
    programId: "PROG-001",
    contractRef: "FA8532-25-C-0042",
    description:
      "Monthly report summarizing subcontractor progress, issues, risks, and financial status against the contracted effort.",
    lastUpdated: "2026-02-16T07:30:00Z",
  },

  // ── PROG-002: RATS EDMS ──────────────────────────────────────────────
  {
    id: "CDRL-007",
    title: "Training Plan",
    type: "CDRL",
    status: "Draft",
    dueDate: "2026-03-15T17:00:00Z",
    assignedTo: "Sarah Chen",
    programId: "PROG-002",
    contractRef: "FA8540-24-C-0017",
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
    programId: "PROG-002",
    contractRef: "FA8540-24-C-0017",
    description:
      "Contains the executable software, source files, and associated documentation needed to compile, build, and integrate the software.",
    lastUpdated: "2026-02-13T09:45:00Z",
  },
  {
    id: "SDRL-003",
    title: "Monthly Site Activity Report — Feb 2026",
    type: "SDRL",
    status: "Submitted",
    dueDate: "2026-02-05T17:00:00Z",
    assignedTo: "Mike Lee",
    programId: "PROG-002",
    contractRef: "FA8540-24-C-0017",
    description:
      "Monthly report covering simulation hours flown, maintenance performed, cyber training completed, and personnel time distribution.",
    lastUpdated: "2026-02-04T15:10:00Z",
  },

  // ── PROG-003: Cyber Security Training ───────────────────────────────
  {
    id: "CDRL-009",
    title: "Cybersecurity Training Curriculum",
    type: "CDRL",
    status: "Approved",
    dueDate: "2026-03-01T17:00:00Z",
    assignedTo: "Dana Park",
    programId: "PROG-003",
    contractRef: "FA7014-25-C-0089",
    description:
      "Comprehensive curriculum document covering required cybersecurity awareness modules, certification tracks, and assessment criteria.",
    lastUpdated: "2026-02-20T10:00:00Z",
  },
  {
    id: "CDRL-010",
    title: "Quarterly Compliance Report — Q1 2026",
    type: "CDRL",
    status: "In Review",
    dueDate: "2026-04-10T17:00:00Z",
    assignedTo: "Dana Park",
    programId: "PROG-003",
    contractRef: "FA7014-25-C-0089",
    description:
      "Reports on training completion rates, certification status, and CMMC compliance posture for Q1 2026.",
    lastUpdated: "2026-02-28T09:30:00Z",
  },
];

export class MockDeliverableConnector {
  readonly name = "MockDeliverables";

  async getDeliverables(): Promise<Deliverable[]> {
    return MOCK_DELIVERABLES;
  }
}

export { MOCK_DELIVERABLES };
