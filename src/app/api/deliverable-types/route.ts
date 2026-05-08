import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasAnyRole } from "@/lib/auth/roles";
import { listDeliverableTypes } from "@/lib/dataverse/deliverable-types";
import {
  dataverseFetch,
  isDataverseConfigured,
} from "@/lib/dataverse/client";
import {
  errorResponse,
  getBusinessRuleCodeFromError,
} from "@/lib/errors/business-rules";
import type { DeliverableType } from "@/lib/models/deliverable";

interface DataverseDeliverableTypeRow {
  drg_deliverabletypeid: string;
  drg_name?: string;
  drg_normalizedname?: string;
  drg_isactive?: boolean;
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const deliverableTypes = await listDeliverableTypes();
    return NextResponse.json({ deliverableTypes });
  } catch (error) {
    return errorResponse(error, {
      fallback: "Failed to load deliverable types.",
    });
  }
}

function requiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTypeName(value: string) {
  return value.trim().toLowerCase();
}

async function createDeliverableType(name: string): Promise<DeliverableType> {
  const trimmedName = name.trim();

  if (!isDataverseConfigured()) {
    return {
      id: trimmedName,
      name: trimmedName,
      normalizedName: normalizeTypeName(trimmedName),
      isActive: true,
    };
  }

  const response = await dataverseFetch<DataverseDeliverableTypeRow>(
    "/drg_deliverabletypes",
    {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        drg_name: trimmedName,
        drg_normalizedname: normalizeTypeName(trimmedName),
        drg_isactive: true,
      }),
    }
  );

  return {
    id: response.drg_deliverabletypeid,
    name: response.drg_name ?? trimmedName,
    normalizedName: response.drg_normalizedname ?? normalizeTypeName(trimmedName),
    isActive: response.drg_isactive !== false,
  };
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (
    !hasAnyRole(session.user.internalRoles, [
      "drg-admin",
      "drg-program-owner",
      "drg-staff",
    ])
  ) {
    return NextResponse.json(
      {
        error:
          "Only DRG admins, program owners, and DRG staff can create deliverable types.",
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const name = requiredString(body?.name);

  if (!name) {
    return NextResponse.json(
      { error: "Deliverable type name is required." },
      { status: 400 }
    );
  }

  try {
    const existingTypes = await listDeliverableTypes();
    const normalizedName = normalizeTypeName(name);
    const existingType = existingTypes.find(
      (type) => type.normalizedName === normalizedName
    );

    if (existingType) {
      return NextResponse.json({ deliverableType: existingType, created: false });
    }

    const deliverableType = await createDeliverableType(name);
    return NextResponse.json({ deliverableType, created: true }, { status: 201 });
  } catch (error) {
    if (getBusinessRuleCodeFromError(error) === "duplicateDeliverableType") {
      const existingTypes = await listDeliverableTypes();
      const existingType = existingTypes.find(
        (type) =>
          type.normalizedName === normalizeTypeName(name) ||
          normalizeTypeName(type.name) === normalizeTypeName(name)
      );

      if (existingType) {
        return NextResponse.json({ deliverableType: existingType, created: false });
      }
    }

    return errorResponse(error, {
      fallback: "Failed to create deliverable type.",
      duplicateConflict: "duplicateDeliverableType",
    });
  }
}
