"use client";

import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

interface AccessRestrictedNoticeProps {
  title?: string;
  message: string;
}

export default function AccessRestrictedNotice({
  title = "Access restricted",
  message,
}: AccessRestrictedNoticeProps) {
  return (
    <Alert severity="warning" sx={{ alignItems: "flex-start" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>
        {title}
      </Typography>
      <Typography variant="body2">{message}</Typography>
    </Alert>
  );
}
