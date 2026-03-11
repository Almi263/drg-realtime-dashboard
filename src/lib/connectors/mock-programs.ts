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
