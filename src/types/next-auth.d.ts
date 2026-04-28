import type { InternalRole } from "@/lib/auth/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      internalRoles: InternalRole[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    oid?: unknown;
    tid?: unknown;
    entraRoles?: unknown;
    entraGroups?: unknown;
    internalRoles?: InternalRole[];
  }
}
