import { MockProgramConnector } from "@/lib/connectors/mock-programs";
import { normalizeEmail } from "@/lib/auth/roles";
import type { Program, ProgramAccess, ProgramSite, ProgramStatus } from "@/lib/models/program";
import {
  getFormattedValue,
  isDataverseConfigured,
  listRows,
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

export async function listVisiblePrograms(user: DataverseUser): Promise<Program[]> {
  const programs = await listPrograms();

  if (isInternalAllProgramsUser(user)) {
    return programs;
  }

  const email = normalizeEmail(user.email);
  return programs.filter((program) =>
    program.access.some((entry) => normalizeEmail(entry.email) === email)
  );
}

export async function getProgramById(
  id: string,
  user?: DataverseUser
): Promise<Program | undefined> {
  const programs = user ? await listVisiblePrograms(user) : await listPrograms();
  return programs.find((program) => program.id === id);
}
