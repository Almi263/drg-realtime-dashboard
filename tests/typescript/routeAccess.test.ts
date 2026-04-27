import { describe, expect, it } from "vitest";
import { APP_ROUTES, canRoleAccessRoute, ROUTE_ALLOWED_ROLES } from "@/lib/auth/route-access";
import { ROLES, type Role } from "@/lib/context/role-context";

describe("route access policy", () => {
  it("allows only admin and staff on submit page", () => {
    expect(canRoleAccessRoute("drg-admin", "/submit")).toBe(true);
    expect(canRoleAccessRoute("drg-staff", "/submit")).toBe(true);
    expect(canRoleAccessRoute("gov-reviewer", "/submit")).toBe(false);
  });

  it("allows all roles on non-submit pages", () => {
    const publicRoutes = APP_ROUTES.filter((route) => route !== "/submit");
    for (const route of publicRoutes) {
      for (const role of ROLES) {
        expect(canRoleAccessRoute(role, route)).toBe(true);
      }
    }
  });

  it("keeps policy explicit with no empty route-role mappings", () => {
    for (const route of APP_ROUTES) {
      expect(ROUTE_ALLOWED_ROLES[route].length).toBeGreaterThan(0);
    }
  });

  it("does not accidentally allow unknown role strings", () => {
    const unknownRole = "not-a-real-role" as Role;
    expect(canRoleAccessRoute(unknownRole, "/submit")).toBe(false);
  });
});
