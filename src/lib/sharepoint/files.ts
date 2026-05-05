import "server-only";

import { cache } from "react";
import { businessRuleError } from "@/lib/errors/business-rules";

export interface SharePointFileResult {
  siteUrl: string;
  driveId: string;
  itemId: string;
  webUrl: string;
  sizeKb: number;
}

function isSharePointConfigured() {
  return Boolean(
    process.env.SHAREPOINT_TENANT_ID &&
      process.env.SHAREPOINT_CLIENT_ID &&
      process.env.SHAREPOINT_CLIENT_SECRET &&
      process.env.SHAREPOINT_SITE_ID &&
      process.env.SHAREPOINT_DRIVE_ID
  );
}

export function isSharePointUploadConfigured() {
  return isSharePointConfigured();
}

const getGraphToken = cache(async () => {
  if (!isSharePointConfigured()) {
    throw new Error("SharePoint is not configured.");
  }

  const body = new URLSearchParams({
    client_id: process.env.SHAREPOINT_CLIENT_ID ?? "",
    client_secret: process.env.SHAREPOINT_CLIENT_SECRET ?? "",
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${process.env.SHAREPOINT_TENANT_ID}/oauth2/v2.0/token`,
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
    throw new Error(`SharePoint token request failed: ${response.status}`);
  }

  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("SharePoint token response did not include an access token.");
  }

  return json.access_token;
});

function encodePathSegment(segment: string) {
  return segment.replace(/[\\/:*?"<>|]/g, "-");
}

function getReadableFolderName(id: string, name?: string) {
  const readableName = name?.trim();
  return encodePathSegment(readableName ? `${id} - ${readableName}` : id);
}

function getProgramFolderPath(programId: string, programName?: string) {
  const baseFolder = process.env.SHAREPOINT_DOCUMENT_FOLDER ?? "DRG Submissions";
  return [baseFolder, getReadableFolderName(programId, programName)].join("/");
}

function getSharePointFolderPath(input: {
  programId: string;
  deliverableId: string;
  programName?: string;
  deliverableName?: string;
}) {
  const baseFolder = process.env.SHAREPOINT_DOCUMENT_FOLDER ?? "DRG Submissions";
  const folderStrategy =
    process.env.SHAREPOINT_FOLDER_STRATEGY ?? "program-deliverable";

  if (folderStrategy === "flat") {
    return baseFolder;
  }

  return [
    baseFolder,
    getReadableFolderName(input.programId, input.programName),
    getReadableFolderName(input.deliverableId, input.deliverableName),
  ].join("/");
}

function getStoredFileName(fileName: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${timestamp}-${encodePathSegment(fileName)}`;
}

function toGraphPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function getDriveItemByPath(token: string, driveId: string, path: string) {
  return fetch(
    `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${toGraphPath(
      path
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );
}

async function createFolder(
  token: string,
  driveId: string,
  parentPath: string,
  name: string
) {
  const parentSelector = parentPath
    ? `root:/${toGraphPath(parentPath)}:/children`
    : "root/children";
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${driveId}/${parentSelector}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        folder: {},
        "@microsoft.graph.conflictBehavior": "fail",
      }),
      cache: "no-store",
    }
  );

  if (response.ok || response.status === 409) {
    return;
  }

  const details = await response.text().catch(() => "");
  throw new Error(
    `SharePoint folder creation failed: ${response.status}${
      details ? ` - ${details}` : ""
    }`
  );
}

export async function ensureSharePointFolderPath(path: string) {
  const token = await getGraphToken();
  const driveId = process.env.SHAREPOINT_DRIVE_ID ?? "";
  const segments = path.split("/").map(encodePathSegment).filter(Boolean);
  let currentPath = "";

  for (const segment of segments) {
    const nextPath = currentPath ? `${currentPath}/${segment}` : segment;
    const response = await getDriveItemByPath(token, driveId, nextPath);

    if (response.ok) {
      currentPath = nextPath;
      continue;
    }

    if (response.status !== 404) {
      const details = await response.text().catch(() => "");
      throw new Error(
        `SharePoint folder lookup failed: ${response.status}${
          details ? ` - ${details}` : ""
        }`
      );
    }

    await createFolder(token, driveId, currentPath, segment);
    currentPath = nextPath;
  }
}

export async function ensureProgramFolder(input: {
  programId: string;
  programName: string;
}) {
  await ensureSharePointFolderPath(
    getProgramFolderPath(input.programId, input.programName)
  );
}

export async function ensureDeliverableFolder(input: {
  programId: string;
  deliverableId: string;
  programName: string;
  deliverableName: string;
}) {
  await ensureSharePointFolderPath(getSharePointFolderPath(input));
}

export async function uploadPdfToSharePoint(input: {
  programId: string;
  deliverableId: string;
  programName?: string;
  deliverableName?: string;
  fileName: string;
  content: Blob | ArrayBuffer;
}): Promise<SharePointFileResult> {
  if (!input.fileName.toLowerCase().endsWith(".pdf")) {
    throw businessRuleError("pdfRequired");
  }

  const token = await getGraphToken();
  const siteId = process.env.SHAREPOINT_SITE_ID ?? "";
  const driveId = process.env.SHAREPOINT_DRIVE_ID ?? "";
  const folderPath = getSharePointFolderPath(input);
  await ensureSharePointFolderPath(folderPath);
  const path = `${folderPath}/${getStoredFileName(input.fileName)}`;

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${toGraphPath(
      path
    )}:/content`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/pdf",
      },
      body: input.content instanceof Blob ? input.content : new Blob([input.content]),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `SharePoint upload failed: ${response.status}${details ? ` - ${details}` : ""}`
    );
  }

  const item = (await response.json()) as {
    id: string;
    webUrl: string;
    size?: number;
    parentReference?: { driveId?: string; siteId?: string };
  };

  return {
    siteUrl: process.env.SHAREPOINT_SITE_URL ?? "",
    driveId: item.parentReference?.driveId ?? driveId,
    itemId: item.id,
    webUrl: item.webUrl,
    sizeKb: Math.ceil((item.size ?? 0) / 1024),
  };
}
