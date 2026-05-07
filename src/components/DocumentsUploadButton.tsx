"use client";

import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import NextLink from "next/link";

export default function DocumentsUploadButton() {
  return (
    <Tooltip title="Upload a PDF deliverable document">
      <Button
        component={NextLink}
        href="/submit?from=documents"
        variant="contained"
        size="small"
        startIcon={<UploadFileIcon />}
        sx={{ flexShrink: 0, alignSelf: { xs: "flex-end", sm: "center" } }}
      >
        Upload Document
      </Button>
    </Tooltip>
  );
}
