import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Approval } from "@/lib/models/approval";
import type { Program } from "@/lib/models/program";

vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: vi.fn() }));

const DATAVERSE_URL = "https://org.crm.dynamics.com";
const FORMATTED_VALUE_ANNOTATION =
  "OData.Community.Display.V1.FormattedValue";

function configureDataverseEnv() {
  vi.stubEnv("DATAVERSE_URL", DATAVERSE_URL);
  vi.stubEnv("DATAVERSE_TENANT_ID", "tenant-id");
  vi.stubEnv("DATAVERSE_CLIENT_ID", "client-id");
  vi.stubEnv("DATAVERSE_CLIENT_SECRET", "client-secret");
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    statusText: init?.statusText,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

function createDataverseFetchMock(
  handlers: Record<string, (request: Request) => Response | Promise<Response>>
) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = request.url;

    if (url.includes("login.microsoftonline.com")) {
      return jsonResponse({ access_token: "dataverse-token" });
    }

    const match = Object.entries(handlers).find(([key]) => url.includes(key));
    if (!match) {
      throw new Error(`Unhandled fetch URL: ${url}`);
    }

    return match[1](request);
  });
}

function createProgram(input: Partial<Program> = {}): Program {
  return {
    id: "program-1",
    name: "Surface Comms",
    programNumber: "PRG-001",
    contractRef: "W912-001",
    description: "",
    sites: [],
    status: "Active",
    startDate: "",
    endDate: "",
    creatorUpn: "owner@drg.test",
    ownerUpn: "owner@drg.test",
    primarySiteCount: 0,
    createdAt: "",
    access: [],
    ...input,
  };
}

function createApproval(input: Partial<Approval> = {}): Approval {
  return {
    id: "approval-1",
    name: "Review CDRL-001",
    programId: "program-1",
    deliverableId: "deliverable-1",
    documentId: "document-1",
    submissionNumber: 1,
    reviewerEmail: "reviewer@gov.test",
    decision: "Pending",
    isCurrent: true,
    ...input,
  };
}

describe("production integration layer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("maps Dataverse choice labels and lookup IDs for documents", async () => {
    vi.resetModules();
    configureDataverseEnv();
    global.fetch = createDataverseFetchMock({
      "/drg_documents?": () =>
        jsonResponse({
          value: [
            {
              drg_documentid: "document-1",
              drg_name: "Reviewed response",
              drg_filename: "response.docx",
              drg_filesizekb: 42,
              drg_submissionnumber: 2,
              drg_uploadedbyemail: "reviewer@gov.test",
              drg_uploadedon: "2026-04-01T12:00:00Z",
              _drg_uploadedby_value: "user-1",
              _drg_deliverable_value: "deliverable-1",
              _drg_program_value: "program-1",
              _drg_parentdocument_value: "submission-1",
              _drg_approval_value: "approval-1",
              drg_sharepointsiteurl: "https://sharepoint.test/sites/drg",
              drg_sharepointdriveid: "drive-1",
              drg_sharepointitemid: "item-1",
              drg_sharepointurl: "https://sharepoint.test/file",
              drg_versionlabel: "v2",
              drg_reviewduedate: "2026-04-15",
              _drg_viewedby_value: "viewer-1",
              drg_viewedbyemail: "staff@drg.test",
              drg_viewedon: "2026-04-02T12:00:00Z",
              drg_checksum: "abc123",
              drg_iscurrentversion: true,
              [`drg_documentrole@${FORMATTED_VALUE_ANNOTATION}`]:
                "Reviewer Response",
              [`drg_status@${FORMATTED_VALUE_ANNOTATION}`]: "Reviewed",
            },
          ],
        }),
    });

    const { listDocuments } = await import("@/lib/dataverse/documents");

    await expect(listDocuments()).resolves.toMatchObject([
      {
        id: "document-1",
        fileType: "Word",
        deliverableId: "deliverable-1",
        programId: "program-1",
        documentRole: "Reviewer Response",
        parentDocumentId: "submission-1",
        approvalId: "approval-1",
        status: "Reviewed",
      },
    ]);
  });

  it("filters visible programs by internal role and active program access", async () => {
    vi.resetModules();
    configureDataverseEnv();
    global.fetch = createDataverseFetchMock({
      "/drg_programs?": () =>
        jsonResponse({
          value: [
            {
              drg_programid: "program-1",
              drg_name: "Visible Program",
              drg_programnumber: "PRG-001",
              drg_contractref: "W912-001",
              [`drg_status@${FORMATTED_VALUE_ANNOTATION}`]: "Active",
            },
            {
              drg_programid: "program-2",
              drg_name: "Hidden Program",
              drg_programnumber: "PRG-002",
              drg_contractref: "W912-002",
              [`drg_status@${FORMATTED_VALUE_ANNOTATION}`]: "Active",
            },
            {
              drg_programid: "program-3",
              drg_name: "Archived Program",
              drg_programnumber: "PRG-003",
              drg_contractref: "W912-003",
              [`drg_status@${FORMATTED_VALUE_ANNOTATION}`]: "Archived",
            },
          ],
        }),
      "/drg_programsites?": () => jsonResponse({ value: [] }),
      "/drg_programaccesses?": () =>
        jsonResponse({
          value: [
            {
              drg_programaccessid: "access-1",
              drg_email: "reviewer@gov.test",
              drg_isactive: true,
              _drg_program_value: "program-1",
              [`drg_accessrole@${FORMATTED_VALUE_ANNOTATION}`]:
                "External Reviewer",
            },
            {
              drg_programaccessid: "access-2",
              drg_email: "reviewer@gov.test",
              drg_isactive: false,
              _drg_program_value: "program-2",
              [`drg_accessrole@${FORMATTED_VALUE_ANNOTATION}`]:
                "External Reviewer",
            },
            {
              drg_programaccessid: "access-3",
              drg_email: "reviewer@gov.test",
              drg_isactive: true,
              _drg_program_value: "program-3",
              [`drg_accessrole@${FORMATTED_VALUE_ANNOTATION}`]:
                "External Reviewer",
            },
          ],
        }),
    });

    const { listVisiblePrograms } = await import("@/lib/dataverse/programs");

    const reviewerPrograms = await listVisiblePrograms({
      email: "reviewer@gov.test",
      internalRoles: ["external-reviewer"],
    });
    const adminPrograms = await listVisiblePrograms({
      email: "admin@drg.test",
      internalRoles: ["drg-admin"],
    });

    expect(reviewerPrograms.map((program) => program.id)).toEqual(["program-1"]);
    expect(adminPrograms.map((program) => program.id)).toEqual([
      "program-1",
      "program-2",
    ]);
  });

  it("blocks non-PDF uploads before SharePoint is called", async () => {
    vi.resetModules();
    vi.stubEnv("SHAREPOINT_TENANT_ID", "tenant-id");
    vi.stubEnv("SHAREPOINT_CLIENT_ID", "client-id");
    vi.stubEnv("SHAREPOINT_CLIENT_SECRET", "client-secret");
    vi.stubEnv("SHAREPOINT_SITE_ID", "site-id");
    vi.stubEnv("SHAREPOINT_DRIVE_ID", "drive-id");
    global.fetch = vi.fn();

    const { uploadPdfToSharePoint } = await import("@/lib/sharepoint/files");

    await expect(
      uploadPdfToSharePoint({
        programId: "program-1",
        deliverableId: "deliverable-1",
        fileName: "submission.docx",
        content: new ArrayBuffer(0),
      })
    ).rejects.toMatchObject({ code: "pdfRequired" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("blocks upload actions for archived programs", async () => {
    const { canUploadToProgram } = await import("@/lib/auth/guards");
    const program = createProgram({
      status: "Archived",
      access: [
        {
          id: "access-1",
          programId: "program-1",
          email: "staff@drg.test",
          accessRole: "DRG Staff",
          isActive: true,
          grantedAt: "",
          grantedByEmail: "admin@drg.test",
        },
      ],
    });

    expect(
      canUploadToProgram(
        { email: "staff@drg.test", internalRoles: ["drg-staff"] },
        program
      )
    ).toBe(false);
  });

  it("requires comments when rejecting an approval", async () => {
    vi.resetModules();
    const { submitApprovalDecision } = await import("@/lib/dataverse/approvals");
    const program = createProgram({
      access: [
        {
          id: "access-1",
          programId: "program-1",
          email: "reviewer@gov.test",
          accessRole: "External Reviewer",
          isActive: true,
          grantedAt: "",
          grantedByEmail: "admin@drg.test",
        },
      ],
    });

    await expect(
      submitApprovalDecision({
        user: {
          email: "reviewer@gov.test",
          internalRoles: ["external-reviewer"],
        },
        program,
        approval: createApproval(),
        approvalId: "approval-1",
        decision: "Rejected",
        comments: " ",
      })
    ).rejects.toMatchObject({ code: "rejectionCommentsRequired" });
  });

  it("requires a signed approval PDF when approving", async () => {
    vi.resetModules();
    const { submitApprovalDecision } = await import("@/lib/dataverse/approvals");
    const program = createProgram({
      access: [
        {
          id: "access-1",
          programId: "program-1",
          email: "reviewer@gov.test",
          accessRole: "External Reviewer",
          isActive: true,
          grantedAt: "",
          grantedByEmail: "admin@drg.test",
        },
      ],
    });

    await expect(
      submitApprovalDecision({
        user: {
          email: "reviewer@gov.test",
          internalRoles: ["external-reviewer"],
        },
        program,
        approval: createApproval(),
        approvalId: "approval-1",
        decision: "Approved",
      })
    ).rejects.toMatchObject({ code: "signedApprovalPdfRequired" });
  });

  it("creates the expected Dataverse document access log payload", async () => {
    vi.resetModules();
    configureDataverseEnv();
    let accessLogPayload: Record<string, unknown> | undefined;
    global.fetch = createDataverseFetchMock({
      "/drg_documentaccesslogs": async (request) => {
        accessLogPayload = await request.json();
        return new Response(null, { status: 204 });
      },
    });

    const { createDocumentAccessLog } = await import(
      "@/lib/dataverse/document-access-logs"
    );
    await createDocumentAccessLog({
      documentId: "document-1",
      programId: "program-1",
      actorUserId: "user-1",
      actorName: "DRG Staff",
      actorEmail: "staff@drg.test",
      action: "Download",
      source: "Web App",
    });

    expect(accessLogPayload).toMatchObject({
      drg_name: expect.stringContaining("Download | staff@drg.test |"),
      "drg_document@odata.bind": "/drg_documents(document-1)",
      "drg_program@odata.bind": "/drg_programs(program-1)",
      "drg_actoruser@odata.bind": "/systemusers(user-1)",
      drg_actorname: "DRG Staff",
      drg_actoremail: "staff@drg.test",
      drg_action: "Download",
      drg_source: "Web App",
    });
    expect(accessLogPayload?.drg_occurredon).toEqual(expect.any(String));
  });

  it("sends the expected Power Automate acknowledgment payload", async () => {
    vi.resetModules();
    vi.stubEnv(
      "POWER_AUTOMATE_APPROVAL_ACKNOWLEDGED_URL",
      "https://flow.test/acknowledge"
    );
    let flowPayload: Record<string, unknown> | undefined;
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      flowPayload = await request.json();
      return jsonResponse({ ok: true });
    });

    const { acknowledgeSignedApprovalFlow } = await import(
      "@/lib/power-automate/flows"
    );
    const result = await acknowledgeSignedApprovalFlow({
      deliverableId: "deliverable-1",
      acceptedSubmissionDocumentId: "submission-1",
      signedApprovalDocumentId: "signed-approval-1",
      approvalId: "approval-1",
      acknowledgedByEmail: "staff@drg.test",
      acknowledgedByName: "DRG Staff",
      acknowledgedByUserId: "user-1",
    });

    expect(result).toEqual({ skipped: false });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://flow.test/acknowledge",
      expect.objectContaining({ method: "POST" })
    );
    expect(flowPayload).toEqual({
      deliverableId: "deliverable-1",
      acceptedSubmissionDocumentId: "submission-1",
      signedApprovalDocumentId: "signed-approval-1",
      approvalId: "approval-1",
      acknowledgedByEmail: "staff@drg.test",
      acknowledgedByName: "DRG Staff",
      acknowledgedByUserId: "user-1",
    });
  });

  it("keeps mock connector fixtures out of production page imports", async () => {
    const repoRoot = process.cwd();
    const productionPages = [
      "src/app/page.tsx",
      "src/app/programs/page.tsx",
      "src/app/programs/[id]/page.tsx",
      "src/app/programs/[id]/access/page.tsx",
      "src/app/programs/archived/page.tsx",
      "src/app/records/page.tsx",
      "src/app/records/[id]/page.tsx",
      "src/app/documents/page.tsx",
      "src/app/documents/[id]/page.tsx",
      "src/app/submit/page.tsx",
    ];

    await Promise.all(
      productionPages.map(async (relativePath) => {
        const source = await readFile(path.join(repoRoot, relativePath), "utf8");
        expect(source, relativePath).not.toMatch(/@\/lib\/connectors\/mock-/);
      })
    );
  });
});
