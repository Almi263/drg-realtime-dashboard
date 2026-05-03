import { cache } from "react";

const DATAVERSE_API_VERSION = "v9.2";

export interface DataverseListResponse<T> {
  value: T[];
}

export type DataverseUser = {
  id?: string;
  email?: string | null;
  internalRoles?: readonly string[];
};

function getDataverseUrl() {
  return (
    process.env.DATAVERSE_URL ??
    process.env.DATAVERSE_ENVIRONMENT_URL ??
    ""
  ).replace(/\/$/, "");
}

export function isDataverseConfigured() {
  return Boolean(
    getDataverseUrl() &&
      process.env.DATAVERSE_TENANT_ID &&
      process.env.DATAVERSE_CLIENT_ID &&
      process.env.DATAVERSE_CLIENT_SECRET
  );
}

export function getDataverseApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getDataverseUrl()}/api/data/${DATAVERSE_API_VERSION}${normalizedPath}`;
}

export function escapeODataString(value: string) {
  return value.replace(/'/g, "''");
}

export function lookupBind(entitySetName: string, id: string) {
  return `/${entitySetName}(${id})`;
}

const getAccessToken = cache(async () => {
  if (!isDataverseConfigured()) {
    throw new Error("Dataverse is not configured.");
  }

  const tenantId = process.env.DATAVERSE_TENANT_ID;
  const body = new URLSearchParams({
    client_id: process.env.DATAVERSE_CLIENT_ID ?? "",
    client_secret: process.env.DATAVERSE_CLIENT_SECRET ?? "",
    grant_type: "client_credentials",
    scope: `${getDataverseUrl()}/.default`,
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Dataverse token request failed: ${response.status}`);
  }

  const json = (await response.json()) as { access_token?: string };

  if (!json.access_token) {
    throw new Error("Dataverse token response did not include an access token.");
  }

  return json.access_token;
});

export async function dataverseFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(getDataverseApiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "OData-Version": "4.0",
      "OData-MaxVersion": "4.0",
      Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Dataverse request failed: ${response.status} ${response.statusText}${details ? ` - ${details}` : ""}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function listRows<T>(
  entitySetName: string,
  query = ""
): Promise<T[]> {
  const path = query
    ? `/${entitySetName}?${query.replace(/^\?/, "")}`
    : `/${entitySetName}`;
  const response = await dataverseFetch<DataverseListResponse<T>>(path);
  return response.value;
}

export function getFormattedValue(
  row: Record<string, unknown>,
  column: string
) {
  const key = `${column}@OData.Community.Display.V1.FormattedValue`;
  return typeof row[key] === "string" ? row[key] : undefined;
}
