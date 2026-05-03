// Requires next-auth v5 (Auth.js) for App Router support

import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { mapClaimsToInternalRoles } from "@/lib/auth/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER!,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  callbacks: {
    authorized({ auth }) {
      return !!auth;
    },

    async jwt({ token, profile }) {
      if (profile) {
        const claims = profile as Record<string, unknown>;

        token.oid = claims.oid;
        token.tid = claims.tid;
        token.email =
          typeof claims.email === "string"
            ? claims.email
            : typeof claims.preferred_username === "string"
              ? claims.preferred_username
              : token.email;

        token.entraRoles = claims.roles;
        token.entraGroups = claims.groups;
        token.internalRoles = mapClaimsToInternalRoles(claims);
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = String(token.oid ?? "");
      session.user.tenantId = String(token.tid ?? "");
      session.user.email = String(token.email ?? session.user.email ?? "");
      session.user.internalRoles = Array.isArray(token.internalRoles)
        ? token.internalRoles
        : [];

      return session;
    },
  },
});
