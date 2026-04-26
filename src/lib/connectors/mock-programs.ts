// Mock connector. Swap for a real one (Dataverse, Azure SQL, etc.) by
// implementing the same getPrograms/getProgramById interface.
import type { Program } from "@/lib/models/program";

const MOCK_PROGRAMS: Program[] = [
  {
    id: "PROG-001",
    name: "Surface Communications",
    contractRef: "FA8532-25-C-0042",
    description:
      "Naval surface communications system maintenance, simulation operations, and monthly CDRL/SDRL reporting across 26 global sites.",
    sites: [
      "Norfolk, VA",
      "Pearl Harbor, HI",
      "Rota, Spain",
      "Yokosuka, Japan",
      "San Diego, CA",
      "Jacksonville, FL",
      "Mayport, FL",
      "Bremerton, WA",
      "Everett, WA",
      "Pascagoula, MS",
    ],
    startDate: "2024-10-01T00:00:00Z",
    endDate: "2027-09-30T23:59:59Z",
    creatorEmail: "samantha.reed@drgok.com",
    createdAt: "2024-09-15T14:00:00Z",
    accessList: [
      {
        email: "samantha.reed@drgok.com",
        grantedAt: "2024-09-15T14:00:00Z",
        grantedByEmail: "samantha.reed@drgok.com",
      },
      {
        email: "javier.morales@drgok.com",
        grantedAt: "2024-09-17T16:30:00Z",
        grantedByEmail: "samantha.reed@drgok.com",
      },
      {
        email: "kelly.madison@navy.mil",
        grantedAt: "2024-10-02T09:15:00Z",
        grantedByEmail: "javier.morales@drgok.com",
      },
    ],
  },
  {
    id: "PROG-002",
    name: "RATS EDMS",
    contractRef: "FA8540-24-C-0017",
    description:
      "Reliability and Availability Tracking System — Electronic Document Management System. Shared collaboration hub for DRG personnel and on-site government reps.",
    sites: ["Tinker AFB, OK", "Wright-Patterson AFB, OH"],
    startDate: "2024-01-15T00:00:00Z",
    endDate: "2026-12-31T23:59:59Z",
    creatorEmail: "erin.choi@drgok.com",
    createdAt: "2024-01-05T13:00:00Z",
    accessList: [
      {
        email: "samantha.reed@drgok.com",
        grantedAt: "2024-01-05T13:00:00Z",
        grantedByEmail: "samantha.reed@drgok.com",
      },
      {
        email: "erin.choi@drgok.com",
        grantedAt: "2024-01-10T18:45:00Z",
        grantedByEmail: "samantha.reed@drgok.com",
      },
      {
        email: "marcus.hill@us.af.mil",
        grantedAt: "2024-02-01T11:20:00Z",
        grantedByEmail: "erin.choi@drgok.com",
      },
    ],
  },
  {
    id: "PROG-003",
    name: "Cyber Security Training",
    contractRef: "FA7014-25-C-0089",
    description:
      "Annual cybersecurity awareness, certification training, and compliance reporting for government and contractor personnel.",
    sites: ["Oklahoma City, OK", "Washington, D.C."],
    startDate: "2025-03-01T00:00:00Z",
    endDate: "2026-02-28T23:59:59Z",
    creatorEmail: "javier.morales@drgok.com",
    createdAt: "2025-02-20T15:10:00Z",
    accessList: [
      {
        email: "samantha.reed@drgok.com",
        grantedAt: "2025-02-20T15:10:00Z",
        grantedByEmail: "samantha.reed@drgok.com",
      },
      {
        email: "javier.morales@drgok.com",
        grantedAt: "2025-02-22T10:05:00Z",
        grantedByEmail: "samantha.reed@drgok.com",
      },
      {
        email: "erin.choi@drgok.com",
        grantedAt: "2025-02-25T08:25:00Z",
        grantedByEmail: "samantha.reed@drgok.com",
      },
    ],
  },
];

export class MockProgramConnector {
  readonly name = "MockPrograms";

  async getPrograms(): Promise<Program[]> {
    return MOCK_PROGRAMS;
  }

  async getProgramById(id: string): Promise<Program | undefined> {
    return MOCK_PROGRAMS.find((p) => p.id === id);
  }
}

export { MOCK_PROGRAMS };
