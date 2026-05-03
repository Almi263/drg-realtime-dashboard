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
