import "server-only";

import { cache } from "react";
import { createSign, randomUUID } from "crypto";

const DATAVERSE_API_VERSION = "v9.2";
const FORMATTED_VALUE_ANNOTATION = "OData.Community.Display.V1.FormattedValue";

export interface DataverseListResponse<T> {
  value: T[];
}

export type DataverseUser = {
  id?: string;
  email?: string | null;
  internalRoles?: readonly string[];
};

export class DataverseError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly code?: string;
  readonly details?: string;

  constructor(input: {
    status: number;
    statusText: string;
    message: string;
    code?: string;
    details?: string;
  }) {
    super(input.message);
    this.name = "DataverseError";
    this.status = input.status;
    this.statusText = input.statusText;
    this.code = input.code;
    this.details = input.details;
  }

  get isAlternateKeyConflict() {
    return (
      this.status === 409 ||
      this.status === 412 ||
      this.code === "0x80060892" ||
      this.message.toLowerCase().includes("duplicate") ||
      this.message.toLowerCase().includes("alternate key")
    );
  }
}

function getDataverseUrl() {
  return (
    process.env.DATAVERSE_URL ??
    process.env.DATAVERSE_ENVIRONMENT_URL ??
    ""
  ).replace(/\/$/, "");
}

function getDataverseScope() {
  return (
    process.env.DATAVERSE_SCOPE ??
    process.env.DATAVERSE_RESOURCE ??
    `${getDataverseUrl()}/.default`
  );
}

function isCertificateConfigured() {
  return Boolean(
    process.env.DATAVERSE_CLIENT_CERTIFICATE_PRIVATE_KEY &&
      process.env.DATAVERSE_CLIENT_CERTIFICATE_THUMBPRINT
  );
}

export function isDataverseConfigured() {
  return Boolean(
    getDataverseUrl() &&
      process.env.DATAVERSE_TENANT_ID &&
      process.env.DATAVERSE_CLIENT_ID &&
      (process.env.DATAVERSE_CLIENT_SECRET || isCertificateConfigured())
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

export function getLookupId(
  row: Record<string, unknown>,
  lookupColumn: string
) {
  const key = lookupColumn.startsWith("_")
    ? lookupColumn
    : `_${lookupColumn}_value`;
  return typeof row[key] === "string" ? row[key] : undefined;
}

export function getChoiceLabel<T extends string>(
  row: Record<string, unknown>,
  column: string,
  allowed: readonly T[],
  fallback: T
) {
  const formatted = getFormattedValue(row, column);
  return allowed.includes(formatted as T) ? (formatted as T) : fallback;
}

export function buildODataQuery(input: {
  select?: readonly string[];
  filter?: string;
  expand?: string;
  orderBy?: string;
  top?: number;
}) {
  const params = new URLSearchParams();
  if (input.select?.length) params.set("$select", input.select.join(","));
  if (input.filter) params.set("$filter", input.filter);
  if (input.expand) params.set("$expand", input.expand);
  if (input.orderBy) params.set("$orderby", input.orderBy);
  if (input.top) params.set("$top", String(input.top));
  return params.toString();
}

function base64Url(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getCertificatePrivateKey() {
  return (process.env.DATAVERSE_CLIENT_CERTIFICATE_PRIVATE_KEY ?? "").replace(
    /\\n/g,
    "\n"
  );
}

function createClientAssertion(tokenEndpoint: string) {
  const clientId = process.env.DATAVERSE_CLIENT_ID ?? "";
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
    x5t: process.env.DATAVERSE_CLIENT_CERTIFICATE_THUMBPRINT,
  };
  const payload = {
    aud: tokenEndpoint,
    exp: now + 300,
    iss: clientId,
    jti: randomUUID(),
    nbf: now,
    sub: clientId,
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(payload)
  )}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(getCertificatePrivateKey());

  return `${unsigned}.${base64Url(signature)}`;
}

const getAccessToken = cache(async () => {
  if (!isDataverseConfigured()) {
    throw new Error("Dataverse is not configured.");
  }

  const tenantId = process.env.DATAVERSE_TENANT_ID;
  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: process.env.DATAVERSE_CLIENT_ID ?? "",
    grant_type: "client_credentials",
    scope: getDataverseScope(),
  });

  if (process.env.DATAVERSE_CLIENT_SECRET) {
    body.set("client_secret", process.env.DATAVERSE_CLIENT_SECRET);
  } else {
    body.set(
      "client_assertion_type",
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
    );
    body.set("client_assertion", createClientAssertion(tokenEndpoint));
  }

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new DataverseError({
      status: response.status,
      statusText: response.statusText,
      message: `Dataverse token request failed: ${response.status}`,
      details,
    });
  }

  const json = (await response.json()) as { access_token?: string };

  if (!json.access_token) {
    throw new Error("Dataverse token response did not include an access token.");
  }

  return json.access_token;
});

async function readDataverseError(response: Response) {
  const raw = await response.text().catch(() => "");
  if (!raw) {
    return {
      message: `Dataverse request failed: ${response.status} ${response.statusText}`,
      details: undefined,
      code: undefined,
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      error?: { code?: string; message?: string };
    };
    return {
      message:
        parsed.error?.message ??
        `Dataverse request failed: ${response.status} ${response.statusText}`,
      details: raw,
      code: parsed.error?.code,
    };
  } catch {
    return {
      message: `Dataverse request failed: ${response.status} ${response.statusText}`,
      details: raw,
      code: undefined,
    };
  }
}

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
      Prefer: `odata.include-annotations="${FORMATTED_VALUE_ANNOTATION}"`,
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await readDataverseError(response);
    throw new DataverseError({
      status: response.status,
      statusText: response.statusText,
      message: error.message,
      code: error.code,
      details: error.details,
    });
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
  const key = `${column}@${FORMATTED_VALUE_ANNOTATION}`;
  return typeof row[key] === "string" ? row[key] : undefined;
}
