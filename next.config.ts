import type { NextConfig } from "next";

// Hosts allowed to iframe the dashboard. Keep this list tight — anything here
// can render the app inside their own page. Microsoft Teams loads tabs via
// teams.microsoft.com (web) and ms-teams.com (newer client), and Office.com /
// SharePoint embed via *.office.com and *.sharepoint.com.
const FRAME_ANCESTORS = [
  "'self'",
  "https://teams.microsoft.com",
  "https://*.teams.microsoft.com",
  "https://teams.live.com",
  "https://*.teams.live.com",
  "https://*.skype.com",
  "https://*.office.com",
  "https://*.office365.com",
  "https://*.sharepoint.com",
  "https://*.cloud.microsoft",
].join(" ");

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Replaces the implicit X-Frame-Options DENY behavior so Teams can
          // embed the dashboard inside its tab iframe. CSP frame-ancestors
          // is the modern equivalent and supersedes XFO in browsers that
          // honor both.
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${FRAME_ANCESTORS};`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
