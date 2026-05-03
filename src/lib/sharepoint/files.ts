import { cache } from "react";

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

export async function uploadPdfToSharePoint(input: {
  programId: string;
  deliverableId: string;
  fileName: string;
  content: Blob | ArrayBuffer;
}): Promise<SharePointFileResult> {
  if (!input.fileName.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF files can be uploaded.");
  }

  const token = await getGraphToken();
  const siteId = process.env.SHAREPOINT_SITE_ID ?? "";
  const driveId = process.env.SHAREPOINT_DRIVE_ID ?? "";
  const baseFolder = process.env.SHAREPOINT_DOCUMENT_FOLDER ?? "DRG Submissions";
  const path = [
    baseFolder,
    encodePathSegment(input.programId),
    encodePathSegment(input.deliverableId),
    encodePathSegment(input.fileName),
  ].join("/");

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${path}:/content`,
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
