# App and Power Automate Integration Points

Most workflow automation is Dataverse-triggered. The web app should create or update the right rows, then let the configured flows perform rollups, stamping, superseding, and notifications.

| Product action | App write | Flow triggered |
| --- | --- | --- |
| Program creation with owner | Creates `drg_program` with `drg_owneruser` / `drg_ownerupn` | Program Owner Access Sync creates or updates the owner `drg_programaccess` row |
| Program archive | Updates `drg_program.drg_status = Archived` | Program Archive stamps archive fields and hides/rolls up child records as configured |
| Deliverable type creation | Creates `drg_deliverabletype` | Deliverable Type Normalize writes `drg_normalizedname` |
| Program access grant | Creates or reactivates `drg_programaccess` with normalized email, role, active flag, grant metadata, and Entra object ID when available | Program Access Normalize / access-change flows normalize and enforce access history |
| Program access revoke | Updates `drg_programaccess.drg_isactive = false` | Revoke flow stamps revocation metadata |
| DRG submission upload | Uploads PDF to SharePoint and creates `drg_document` with `documentRole = DRG Submission` | DRG Submission Created assigns submission number, supersedes prior submissions, updates deliverable status, creates approvals, and notifies reviewers |
| Document view/download | Creates `drg_documentaccesslog` row with action `View` or `Download` | Review-start/viewed flows update document/deliverable status and viewed fields |
| Reviewer response upload | Creates `drg_document` with `documentRole = Reviewer Response` and `drg_parentdocument` set to the DRG submission | Reviewer document flows link response PDFs and update review context |
| Signed approval upload | Creates `drg_document` with `documentRole = Signed Approval` and `drg_parentdocument` set to the DRG submission | Signed approval flows link approval PDF and move work toward acknowledgment |
| Reviewer approval/rejection | Updates `drg_approval.drg_decision`, `drg_comments`, and `drg_responsedocument` | Approval decision rollup updates deliverable/document status |
| DRG acknowledgment of signed approval | Calls the instant `DRG Acknowledges Signed Approval` flow with deliverable ID, accepted submission document ID, and signed approval document ID | Acknowledgment flow marks deliverable complete and finalizes accepted document state |
