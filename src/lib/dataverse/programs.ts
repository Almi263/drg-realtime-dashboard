import { MockProgramConnector } from "@/lib/connectors/mock-programs";
import { normalizeEmail } from "@/lib/auth/roles";
import type { Program, ProgramAccess, ProgramSite, ProgramStatus } from "@/lib/models/program";
import {
  dataverseFetch,
  getFormattedValue,
  isDataverseConfigured,
  listRows,
  lookupBind,
  type DataverseUser,
} from "@/lib/dataverse/client";
import { listActiveProgramAccess } from "@/lib/dataverse/program-access";

interface DataverseProgramRow extends Record<string, unknown> {
  drg_programid: string;
  drg_name?: string;
  drg_programnumber?: string;
  drg_contractref?: string;
  drg_description?: string;
  drg_startdate?: string;
  drg_enddate?: string;
  drg_creatorupn?: string;
  _drg_creatoruser_value?: string;
  drg_ownerupn?: string;
  _drg_owneruser_value?: string;
  drg_primarysitecount?: number;
  _drg_archivedby_value?: string;
  drg_archivedon?: string;
  createdon?: string;
}

interface DataverseProgramSiteRow {
  drg_programsiteid?: string;
  drg_name?: string;
  drg_sitecode?: string;
  drg_region?: string;
  drg_isprimary?: boolean;
  _drg_program_value?: string;
}

interface DataverseSystemUserRow {
  systemuserid: string;
}

export interface CreateProgramInput {
  name: string;
  programNumber: string;
  contractRef: string;
  description?: string;
  sites: string[];
  startDate?: string;
  endDate?: string;
  ownerUpn: string;
  creatorUpn: string;
}

function isInternalAllProgramsUser(user: DataverseUser) {
  return Boolean(user.internalRoles?.includes("drg-admin"));
}

function toProgramStatus(value: string | undefined): ProgramStatus {
  switch (value) {
    case "Draft":
    case "Active":
    case "On Hold":
    case "Closed":
    case "Archived":
      return value;
    default:
      return "Active";
  }
}

function normalizeMockProgram(program: Program): Program {
  const legacy = program as unknown as {
    accessList?: ProgramAccess[];
    creatorEmail?: string;
    sites?: Array<string | ProgramSite>;
  };
  const sites =
    legacy.sites?.map((site, index) =>
      typeof site === "string"
        ? {
            id: `${program.id}-site-${index}`,
            programId: program.id,
            name: site,
            isPrimary: index === 0,
          }
        : site
    ) ?? [];
  const access =
    legacy.accessList?.map((entry, index) => ({
      ...entry,
      id: entry.id ?? `${program.id}-access-${index}`,
      programId: program.id,
      accessRole: entry.accessRole ?? "External Reviewer",
      isActive: entry.isActive ?? true,
    })) ?? [];

  return {
    ...program,
    programNumber: program.programNumber ?? program.id,
    status: program.status ?? "Active",
    sites,
    creatorUpn: program.creatorUpn ?? legacy.creatorEmail ?? "",
    ownerUpn: program.ownerUpn ?? legacy.creatorEmail ?? "",
    primarySiteCount: program.primarySiteCount ?? sites.length,
    access,
  };
}

function mapProgramRow(
  row: DataverseProgramRow,
  sites: DataverseProgramSiteRow[],
  accessByProgramId: Map<string, Awaited<ReturnType<typeof listActiveProgramAccess>>>
): Program {
  const id = row.drg_programid;

  return {
    id,
    name: row.drg_name ?? row.drg_programnumber ?? id,
    programNumber: row.drg_programnumber ?? id,
    contractRef: row.drg_contractref ?? row.drg_programnumber ?? id,
    description: row.drg_description ?? "",
    sites: sites
      .filter((site) => site._drg_program_value === id)
      .map((site, index) => ({
        id: site.drg_programsiteid ?? `${id}-site-${index}`,
        programId: id,
        name: site.drg_name ?? "",
        siteCode: site.drg_sitecode,
        region: site.drg_region,
        isPrimary: site.drg_isprimary ?? false,
      }))
      .filter((site) => site.name),
    status: toProgramStatus(getFormattedValue(row, "drg_status")),
    startDate: row.drg_startdate ?? "",
    endDate: row.drg_enddate ?? "",
    creatorUserId: row._drg_creatoruser_value,
    creatorUpn: normalizeEmail(row.drg_creatorupn),
    ownerUserId: row._drg_owneruser_value,
    ownerUpn: normalizeEmail(row.drg_ownerupn),
    primarySiteCount: row.drg_primarysitecount ?? 0,
    archivedByUserId: row._drg_archivedby_value,
    archivedOn: row.drg_archivedon,
    createdAt: row.createdon ?? "",
    access: accessByProgramId.get(id) ?? [],
  };
}

function groupAccessByProgramId(
  access: Awaited<ReturnType<typeof listActiveProgramAccess>>
) {
  const grouped = new Map<string, typeof access>();
  for (const entry of access) {
    grouped.set(entry.programId, [...(grouped.get(entry.programId) ?? []), entry]);
  }
  return grouped;
}

async function listProgramsFromDataverse() {
  const [programRows, siteRows, access] = await Promise.all([
    listRows<DataverseProgramRow>(
      "drg_programs",
      "$select=drg_programid,drg_name,drg_programnumber,drg_contractref,drg_description,drg_startdate,drg_enddate,drg_creatorupn,_drg_creatoruser_value,drg_ownerupn,_drg_owneruser_value,drg_primarysitecount,_drg_archivedby_value,drg_archivedon,createdon,drg_status&$filter=statecode eq 0"
    ),
    listRows<DataverseProgramSiteRow>(
      "drg_programsites",
      "$select=drg_programsiteid,drg_name,drg_sitecode,drg_region,drg_isprimary,_drg_program_value&$filter=statecode eq 0"
    ),
    listActiveProgramAccess(),
  ]);

  const accessByProgramId = groupAccessByProgramId(access);

  return programRows.map((row) => mapProgramRow(row, siteRows, accessByProgramId));
}

export async function listPrograms(): Promise<Program[]> {
  if (!isDataverseConfigured()) {
    const programs = await new MockProgramConnector().getPrograms();
    return programs.map(normalizeMockProgram);
  }

  return listProgramsFromDataverse();
}

export interface ProgramVisibilityOptions {
  includeArchived?: boolean;
  archivedOnly?: boolean;
}

function filterProgramArchiveState(
  programs: Program[],
  options: ProgramVisibilityOptions = {}
) {
  if (options.archivedOnly) {
    return programs.filter((program) => program.status === "Archived");
  }

  if (options.includeArchived) {
    return programs;
  }

  return programs.filter((program) => program.status !== "Archived");
}

export async function listVisiblePrograms(
  user: DataverseUser,
  options: ProgramVisibilityOptions = {}
): Promise<Program[]> {
  const programs = await listPrograms();
  const filteredPrograms = filterProgramArchiveState(programs, options);

  if (isInternalAllProgramsUser(user)) {
    return filteredPrograms;
  }

  const email = normalizeEmail(user.email);
  return filteredPrograms.filter((program) =>
    program.access.some(
      (entry) => entry.isActive && normalizeEmail(entry.email) === email
    )
  );
}

export async function getProgramById(
  id: string,
  user?: DataverseUser
): Promise<Program | undefined> {
  const programs = user
    ? await listVisiblePrograms(user, { includeArchived: true })
    : await listPrograms();
  return programs.find((program) => program.id === id);
}

async function findSystemUserIdByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const rows = await listRows<DataverseSystemUserRow>(
    "systemusers",
    `$select=systemuserid&$top=1&$filter=internalemailaddress eq '${normalizedEmail}' or domainname eq '${normalizedEmail}'`
  );

  return rows[0]?.systemuserid;
}

export async function createProgram(input: CreateProgramInput) {
  if (!isDataverseConfigured()) {
    throw new Error("Dataverse is not configured for program creation.");
  }

  const [creatorUserId, ownerUserId] = await Promise.all([
    findSystemUserIdByEmail(input.creatorUpn),
    findSystemUserIdByEmail(input.ownerUpn),
  ]);

  const payload: Record<string, unknown> = {
    drg_name: input.name,
    drg_programnumber: input.programNumber,
    drg_contractref: input.contractRef,
    drg_description: input.description ?? "",
    drg_startdate: input.startDate,
    drg_enddate: input.endDate,
    drg_creatorupn: input.creatorUpn,
    drg_ownerupn: input.ownerUpn,
    drg_primarysitecount: input.sites.length,
  };

  if (creatorUserId) {
    payload["drg_creatoruser@odata.bind"] = lookupBind("systemusers", creatorUserId);
  }

  if (ownerUserId) {
    payload["drg_owneruser@odata.bind"] = lookupBind("systemusers", ownerUserId);
  }

  const response = await dataverseFetch<{ drg_programid?: string }>(
    "/drg_programs",
    {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    }
  );

  const programId = response.drg_programid;
  if (!programId) {
    throw new Error("Dataverse did not return the created program ID.");
  }

  await Promise.all(
    input.sites.map((site, index) =>
      dataverseFetch<void>("/drg_programsites", {
        method: "POST",
        body: JSON.stringify({
          drg_name: site,
          "drg_program@odata.bind": lookupBind("drg_programs", programId),
          drg_isprimary: index === 0,
        }),
      })
    )
  );

  return programId;
}
