"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  EFFECTIVE_ROLES,
  ROLE_LABELS,
  normalizeEmail,
  type EffectiveRole,
  type InternalRole,
} from "@/lib/auth/roles";
import type { Program, ProgramAccess, ProgramSite } from "@/lib/models/program";

export const ROLES = EFFECTIVE_ROLES;
export type Role = EffectiveRole;
export { ROLE_LABELS };

type ProgramAccessMap = Record<string, ProgramAccess[]>;

function getEffectiveRoles(
  email: string,
  internalRoles: InternalRole[],
  accessMap: ProgramAccessMap
) {
  const roles = new Set<Role>(internalRoles);

  const hasProgramAccess = Object.values(accessMap).some((entries) =>
    entries.some((entry) => normalizeEmail(entry.email) === email)
  );

  if (hasProgramAccess) {
    roles.add("gov-reviewer");
  }

  return EFFECTIVE_ROLES.filter((role) => roles.has(role));
}

interface CreateProgramInput {
  name: string;
  contractRef: string;
  description: string;
  sites: string[];
  startDate: string;
  endDate: string;
}

interface RoleContextValue {
  role: Role | null;
  roles: Role[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: Role | null;
  } | null;
  isLoading: boolean;
  programs: Program[];
  getProgramById: (programId: string) => Program | undefined;
  getProgramAccessList: (programId: string) => ProgramAccess[];
  canViewProgram: (programId: string) => boolean;
  canUploadToProgram: (programId: string) => boolean;
  canManageProgramAccess: (programId: string) => boolean;
  canGrantProgramAccess: (programId: string, email: string) => boolean;
  canRevokeProgramAccess: (programId: string, email: string) => boolean;
  createProgram: (input: CreateProgramInput) => void;
  grantProgramAccess: (programId: string, email: string) => void;
  revokeProgramAccess: (programId: string, email: string) => void;
  hasAnyRole: (allowedRoles: readonly Role[]) => boolean;
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
  roles: [],
  currentUser: null,
  isLoading: true,
  programs: [],
  getProgramById: () => undefined,
  getProgramAccessList: () => [],
  canViewProgram: () => false,
  canUploadToProgram: () => false,
  canManageProgramAccess: () => false,
  canGrantProgramAccess: () => false,
  canRevokeProgramAccess: () => false,
  createProgram: () => {},
  grantProgramAccess: () => {},
  revokeProgramAccess: () => {},
  hasAnyRole: () => false,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programAccessMap, setProgramAccessMap] = useState<ProgramAccessMap>({});
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);

  const internalRoles = (session?.user.internalRoles ?? []) as InternalRole[];
  const currentUserEmail = normalizeEmail(session?.user.email);
  const roles = useMemo(
    () => getEffectiveRoles(currentUserEmail, internalRoles, programAccessMap),
    [currentUserEmail, internalRoles, programAccessMap]
  );
  const role = roles[0] ?? null;

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      setPrograms([]);
      setProgramAccessMap({});
      setIsLoadingPrograms(false);
      return;
    }

    let cancelled = false;
    setIsLoadingPrograms(true);

    fetch("/api/programs")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load programs.");
        }
        return (await response.json()) as { programs: Program[] };
      })
      .then(({ programs }) => {
        if (cancelled) return;
        setPrograms(programs);
        setProgramAccessMap(
          Object.fromEntries(
            programs.map((program) => [program.id, program.access])
          )
        );
      })
      .catch(() => {
        if (cancelled) return;
        setPrograms([]);
        setProgramAccessMap({});
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPrograms(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user, status]);

  const mergedPrograms = useMemo(
    () =>
      programs.map((program) => ({
        ...program,
        access: programAccessMap[program.id] ?? program.access,
      })),
    [programs, programAccessMap]
  );

  const currentUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? session.user.email ?? "Signed-in user",
        email: session.user.email ?? "",
        role,
      }
    : null;

  const getProgramById = (programId: string) =>
    mergedPrograms.find((program) => program.id === programId);

  const getProgramAccessList = (programId: string) => {
    return programAccessMap[programId] ?? [];
  };

  const canViewProgram = (programId: string) => {
    if (internalRoles.includes("drg-admin")) return true;

    return (programAccessMap[programId] ?? []).some(
      (entry) =>
        entry.isActive &&
        normalizeEmail(entry.email) === currentUserEmail
    );
  };

  const canManageProgramAccess = (programId: string) => {
    if (internalRoles.includes("drg-admin")) return true;
    if (!internalRoles.includes("drg-program-owner")) return false;
    return (programAccessMap[programId] ?? []).some(
      (entry) =>
        entry.isActive &&
        entry.accessRole === "Program Owner" &&
        normalizeEmail(entry.email) === currentUserEmail
    );
  };

  const canUploadToProgram = (programId: string) => {
    const program = mergedPrograms.find((program) => program.id === programId);
    if (!program || program.status === "Archived") return false;
    if (internalRoles.includes("drg-admin")) return true;

    return (programAccessMap[programId] ?? []).some((entry) => {
      const isCurrentUser = normalizeEmail(entry.email) === currentUserEmail;
      if (!entry.isActive || !isCurrentUser) return false;

      if (internalRoles.includes("drg-program-owner")) {
        return entry.accessRole === "Program Owner";
      }

      if (internalRoles.includes("drg-staff")) {
        return entry.accessRole === "DRG Staff" || entry.accessRole === "Program Owner";
      }

      if (internalRoles.includes("external-reviewer")) {
        return entry.accessRole === "External Reviewer";
      }

      return false;
    });
  };

  const canGrantProgramAccess = (programId: string, email: string) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !canManageProgramAccess(programId)) return false;

    return !(programAccessMap[programId] ?? []).some(
      (entry) => normalizeEmail(entry.email) === normalizedEmail
    );
  };

  const canRevokeProgramAccess = (programId: string, email: string) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !canManageProgramAccess(programId)) return false;
    if (normalizedEmail === currentUserEmail) return false;

    return (programAccessMap[programId] ?? []).some(
      (entry) => normalizeEmail(entry.email) === normalizedEmail
    );
  };

  const createProgram = (input: CreateProgramInput) => {
    if (
      !currentUserEmail ||
      !internalRoles.includes("drg-admin")
    ) {
      return;
    }

    const createdAt = new Date().toISOString();
    const nextNumber = programs.length + 1;
    const programId = `PROG-${String(nextNumber).padStart(3, "0")}`;
    const newProgram: Program = {
      id: programId,
      name: input.name,
      contractRef: input.contractRef,
      description: input.description,
      sites: input.sites.map((site, index): ProgramSite => ({
        id: `${programId}-site-${index}`,
        programId,
        name: site,
        isPrimary: index === 0,
      })),
      programNumber: programId,
      status: "Draft",
      startDate: input.startDate,
      endDate: input.endDate,
      creatorUpn: currentUserEmail,
      ownerUpn: currentUserEmail,
      primarySiteCount: input.sites.length,
      createdAt,
      access: [
        {
          id: `${programId}-${currentUserEmail}`,
          programId,
          email: currentUserEmail,
          accessRole: "Program Owner",
          isActive: true,
          grantedAt: createdAt,
          grantedByEmail: currentUserEmail,
        },
      ],
    };

    setPrograms((prev) => [...prev, newProgram]);
    setProgramAccessMap((prev) => ({
      ...prev,
      [programId]: newProgram.access,
    }));
  };

  const grantProgramAccess = (programId: string, email: string) => {
    const normalizedEmail = normalizeEmail(email);

    if (!canGrantProgramAccess(programId, normalizedEmail)) return;

    setProgramAccessMap((prev) => ({
      ...prev,
      [programId]: [
        ...(prev[programId] ?? []),
        {
          email: normalizedEmail,
          id: `${programId}-${normalizedEmail}`,
          programId,
          accessRole: "External Reviewer",
          isActive: true,
          grantedAt: new Date().toISOString(),
          grantedByEmail: currentUserEmail,
        },
      ],
    }));
  };

  const revokeProgramAccess = (programId: string, email: string) => {
    const normalizedEmail = normalizeEmail(email);

    if (!canRevokeProgramAccess(programId, normalizedEmail)) return;

    setProgramAccessMap((prev) => ({
      ...prev,
      [programId]: (prev[programId] ?? []).filter(
        (entry) => normalizeEmail(entry.email) !== normalizedEmail
      ),
    }));
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        roles,
        currentUser,
        isLoading: status === "loading" || isLoadingPrograms,
        programs: mergedPrograms,
        getProgramById,
        getProgramAccessList,
        canViewProgram,
        canUploadToProgram,
        canManageProgramAccess,
        canGrantProgramAccess,
        canRevokeProgramAccess,
        createProgram,
        grantProgramAccess,
        revokeProgramAccess,
        hasAnyRole: (allowedRoles) => allowedRoles.some((allowedRole) => roles.includes(allowedRole)),
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
