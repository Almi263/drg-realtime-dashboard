async function getGraphToken() {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_GRAPH_CLIENT_ID;
  const clientSecret = process.env.AZURE_GRAPH_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Missing Microsoft Graph invitation configuration.");
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to get Microsoft Graph token: ${await res.text()}`);
  }

  const json = await res.json();
  return json.access_token as string;
}

export interface ExternalReviewerPrincipal {
  id: string;
  email: string;
  displayName?: string;
}

export async function getExternalReviewerPrincipal(
  email: string
): Promise<ExternalReviewerPrincipal | null> {
  const externalReviewerGroupId = process.env.ENTRA_EXTERNAL_REVIEWER_GROUP_ID;

  if (!externalReviewerGroupId) {
    throw new Error("Missing ENTRA_EXTERNAL_REVIEWER_GROUP_ID.");
  }

  const token = await getGraphToken();
  const normalizedEmail = email.trim().toLowerCase().replace(/'/g, "''");
  const usersRes = await fetch(
    `https://graph.microsoft.com/v1.0/users?$select=id,mail,userPrincipalName,displayName&$top=1&$filter=mail eq '${normalizedEmail}' or userPrincipalName eq '${normalizedEmail}'`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!usersRes.ok) {
    throw new Error(`Failed to verify external reviewer: ${await usersRes.text()}`);
  }

  const usersJson = (await usersRes.json()) as {
    value?: Array<{
      id: string;
      mail?: string | null;
      userPrincipalName?: string | null;
      displayName?: string;
    }>;
  };
  const user = usersJson.value?.[0];

  if (!user) {
    return null;
  }

  const memberOfRes = await fetch(
    `https://graph.microsoft.com/v1.0/users/${user.id}/transitiveMemberOf/microsoft.graph.group?$select=id&$filter=id eq '${externalReviewerGroupId}'`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!memberOfRes.ok) {
    throw new Error(
      `Failed to verify external reviewer group membership: ${await memberOfRes.text()}`
    );
  }

  const memberOfJson = (await memberOfRes.json()) as { value?: Array<{ id: string }> };
  const isExternalReviewer = memberOfJson.value?.some(
    (group) => group.id === externalReviewerGroupId
  );

  if (!isExternalReviewer) {
    return null;
  }

  return {
    id: user.id,
    email: user.mail ?? user.userPrincipalName ?? email,
    displayName: user.displayName,
  };
}

export async function inviteExternalReviewer(email: string) {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("Missing APP_URL for Microsoft Graph invitations.");
  }

  const token = await getGraphToken();

  const res = await fetch("https://graph.microsoft.com/v1.0/invitations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invitedUserEmailAddress: email,
      inviteRedirectUrl: appUrl,
      sendInvitationMessage: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to invite reviewer: ${await res.text()}`);
  }

  return res.json();
}
