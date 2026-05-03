# Power Automate Cloud Flows

This document lists the cloud flows needed to support the Dataverse workflow in [dataverse-data-model.md](./dataverse-data-model.md).

Use Dataverse trigger filters wherever possible so flows only run for relevant rows. Use the app for immediate user-facing validation when the user needs a friendly error before save.

Power Automate usually shows Dataverse table names as plural display names. The schema names in this document are singular, so select the matching plural table in Power Automate, for example:

- `drg_program` -> `drg_programs`
- `drg_programaccess` -> `drg_programaccesses`
- `drg_deliverable` -> `drg_deliverables`
- `drg_deliverabletype` -> `drg_deliverabletypes`
- `drg_document` -> `drg_documents`
- `drg_documentaccesslog` -> `drg_documentaccesslogs`
- `drg_approval` -> `drg_approvals`
- `systemuser` -> `Users`

For lookup row IDs, use the raw Dataverse lookup value from dynamic content when available. Those values usually look like `_drg_program_value`, `_drg_owneruser_value`, `_drg_document_value`, and so on.

For Dataverse choice columns, Power Automate often stores generated numeric values even when the UI shows labels such as Program Owner, Pending, or Archived. The steps below name the intended label; when entering an OData Filter rows value, replace the label with the numeric value from your Dataverse choice if Power Automate does not accept the label.

## 1. Program Owner Access Sync

Flow type: Automated cloud flow

Trigger:

- Dataverse: When a row is added, modified, or deleted
- Change type: Added or modified
- Table name: `drg_programs`
- Scope: Organization
- Select columns: `drg_owneruser`
- Filter rows: `statecode eq 0 and _drg_owneruser_value ne null`
- Trigger condition:
  - `@not(empty(triggerOutputs()?['body/_drg_owneruser_value']))`

Actions:

- Get the program row:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_programs`
  - Row ID: `drg_program` from the trigger, or expression `triggerOutputs()?['body/drg_programid']`
- Get owner user details:
  - Action: Dataverse `Get a row by ID`
  - Table name: `Users`
  - Row ID: `_drg_owneruser_value` from the program row
- Compose owner email:
  - Action: Data Operations `Compose`
  - Inputs: `toLower(trim(outputs('Get_owner_user_details')?['body/internalemailaddress']))`
  - If `internalemailaddress` is blank in your environment, use `domainname` instead.
- List existing owner access rows:
  - Action: Dataverse `List rows`
  - Table name: `drg_programaccesses`
  - Filter rows: `_drg_program_value eq @{outputs('Get_the_program_row')?['body/drg_programid']} and drg_email eq '@{outputs('Compose_owner_email')}'`
  - Row count: `1`
- Check whether an access row exists:
  - Action: Control `Condition`
  - Left value: choose the `Expression` tab and enter `length(outputs('List_existing_owner_access_rows')?['body/value'])`
  - Operator: is equal to
  - Right value: `0`
- If yes, create the access row:
  - Action: Dataverse `Add a new row`
  - Table name: `drg_programaccesses`
  - `drg_name` expression: `concat(outputs('Get_the_program_row')?['body/drg_programnumber'], ' | ', outputs('Compose_owner_email'))`
  - `drg_program` lookup value: dynamic content `drg_program` from `Get the program row`, or expression `outputs('Get_the_program_row')?['body/drg_programid']`
  - `drg_user` lookup value: dynamic content `User` from `Get owner user details`, or expression `outputs('Get_owner_user_details')?['body/systemuserid']`
  - `drg_email` expression: `outputs('Compose_owner_email')`
  - `drg_accessrole`: Program Owner
  - `drg_isactive`: Yes
  - `drg_grantedon` expression: `utcNow()`
  - `drg_grantedby`: triggering user if available
  - `drg_grantedbyemail`: triggering user email if available
- If no, update the existing access row:
  - Action: Dataverse `Update a row`
  - Table name: `drg_programaccesses`
  - Row ID expression: `first(outputs('List_existing_owner_access_rows')?['body/value'])?['drg_programaccessid']`
  - `drg_accessrole`: Program Owner
  - `drg_isactive`: Yes

Notes:

- This flow keeps the explicit program access table aligned with the owner assigned on `drg_program`.

## 2. Program Archive

Flow type: Automated cloud flow

Trigger:

- Dataverse: When a row is added, modified, or deleted
- Change type: Modified
- Table name: `drg_programs`
- Scope: Organization
- Select columns: `drg_status`
- Filter rows: `statecode eq 0 and drg_status eq <Archived choice value>`
- Trigger condition:
  - `@equals(triggerOutputs()?['body/drg_status'], <Archived choice value>)`

Actions:

- Get the program row:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_programs`
  - Row ID: `drg_program` from the trigger, or expression `triggerOutputs()?['body/drg_programid']`
- Check whether `drg_archivedon` is blank:
  - Action: Control `Condition`
  - Condition: `drg_archivedon` is equal to null
- If yes, update the program row:
  - Action: Dataverse `Update a row`
  - Table name: `drg_programs`
  - Row ID: `drg_program` from the trigger, or expression `triggerOutputs()?['body/drg_programid']`
  - `drg_archivedon`: current date/time
  - `drg_archivedby`: triggering user if available
- List active deliverables for the program:
  - Action: Dataverse `List rows`
  - Table name: `drg_deliverables`
  - Filter rows expression: `concat('_drg_program_value eq ', triggerOutputs()?['body/drg_programid'], ' and statecode eq 0')`
- Optional: for each open deliverable, update the deliverable if the app needs a separate archived/hidden view state.
- List current documents for the program:
  - Action: Dataverse `List rows`
  - Table name: `drg_documents`
  - Filter rows expression: `concat('_drg_program_value eq ', triggerOutputs()?['body/drg_programid'], ' and drg_iscurrentversion eq true')`
- Optional: for each visible document, update `drg_status` to Archived if the app should hide documents by document status.

Notes:

- The app should block new uploads when the parent program is archived.
- Downloads and analytics should remain available.

## 3. Deliverable Type Normalize

Flow type: Automated cloud flow

Trigger:

- Dataverse: When a row is added, modified, or deleted
- Change type: Added or modified
- Table name: `drg_deliverabletypes`
- Scope: Organization
- Select columns: `drg_name`
- Filter rows: `statecode eq 0 and drg_name ne null`
- Trigger condition:
  - `@not(empty(triggerOutputs()?['body/drg_name']))`

Actions:

- Compose normalized name:
  - Action: Data Operations `Compose`
  - Inputs: `toLower(trim(triggerOutputs()?['body/drg_name']))`
- Check whether `drg_normalizedname` already matches:
  - Action: Control `Condition`
  - Condition: `drg_normalizedname` is not equal to the compose output
- If yes, update the deliverable type:
  - Action: Dataverse `Update a row`
  - Table name: `drg_deliverabletypes`
  - Row ID: `drg_deliverabletype` from the trigger
  - `drg_normalizedname`: output from `Compose normalized name`

Notes:

- The app should also set `drg_normalizedname` before creating the row so the alternate key can catch duplicates immediately.
- Alternate key: `drg_normalizedname`.

## 4. Program Access Normalize

Flow type: Automated cloud flow

Trigger:

- Dataverse: When a row is added, modified, or deleted
- Change type: Added or modified
- Table name: `drg_programaccesses`
- Scope: Organization
- Select columns: `drg_email`
- Filter rows: `statecode eq 0 and drg_email ne null`
- Trigger condition:
  - `@not(empty(triggerOutputs()?['body/drg_email']))`

Actions:

- Compose normalized email:
  - Action: Data Operations `Compose`
  - Inputs: `toLower(trim(triggerOutputs()?['body/drg_email']))`
- Check whether `drg_email` already matches:
  - Action: Control `Condition`
  - Condition: `drg_email` is not equal to the compose output
- If yes, update the program access row:
  - Action: Dataverse `Update a row`
  - Table name: `drg_programaccesses`
  - Row ID: `drg_programaccess` from the trigger
  - `drg_email`: output from `Compose normalized email`

Notes:

- The app should also normalize email before creating the row.
- Alternate key: `drg_program` + `drg_email`.

## 5. DRG Submission Created

Flow type: Automated cloud flow

Trigger:

- Dataverse: When a row is added, modified, or deleted
- Change type: Added
- Table name: `drg_documents`
- Scope: Organization
- Filter rows: `statecode eq 0`
- Trigger condition:
  - `drg_documentrole = DRG Submission`
  - parent program is not archived

Actions:

- Get the new document row:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_documents`
  - Row ID: `drg_document` from the trigger
- Get parent deliverable:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_deliverables`
  - Row ID: `_drg_deliverable_value` from the document row
- Get parent program:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_programs`
  - Row ID: `_drg_program_value` from the document row
- Validate parent program is not archived:
  - Action: Control `Condition`
  - Condition: parent program `drg_status` is not equal to Archived
  - If archived, terminate the flow as Failed or Cancelled.
- List previous current DRG submission documents:
  - Action: Dataverse `List rows`
  - Table name: `drg_documents`
  - Filter rows: `_drg_deliverable_value eq @{outputs('Get_parent_deliverable')?['body/drg_deliverableid']} and drg_iscurrentversion eq true and drg_documentid ne @{outputs('Get_the_new_document_row')?['body/drg_documentid']}`
- For each previous current submission, update the document:
  - Action: Dataverse `Update a row`
  - Table name: `drg_documents`
  - Row ID: current item `drg_documentid`
  - `drg_status`: Outdated
  - `drg_iscurrentversion`: No
  - `drg_supersededbydocument`: new document
  - `drg_supersededon`: current date/time
- Calculate next submission number:
  - Action: Data Operations `Compose`
  - if deliverable `drg_currentsubmissionnumber` is blank, use `1`
  - otherwise use `drg_currentsubmissionnumber + 1`
- Update new document:
  - Action: Dataverse `Update a row`
  - Table name: `drg_documents`
  - Row ID: new document row ID
  - `drg_submissionnumber`: calculated number
  - `drg_status`: Submitted
  - `drg_iscurrentversion`: Yes
- Update parent deliverable:
  - Action: Dataverse `Update a row`
  - Table name: `drg_deliverables`
  - Row ID: parent deliverable row ID
  - `drg_status`: Submitted
  - `drg_currentsubmissionnumber`: calculated number
  - `drg_lastsubmittedon`: current date/time
  - `drg_isclosed`: No
- List active external reviewer access rows:
  - Action: Dataverse `List rows`
  - Table name: `drg_programaccesses`
  - Filter rows: `_drg_program_value eq @{outputs('Get_parent_program')?['body/drg_programid']} and drg_isactive eq true and drg_accessrole eq <External Reviewer choice value>`
- For each external reviewer, create an approval:
  - Action: Dataverse `Add a new row`
  - Table name: `drg_approvals`
  - `drg_name`: `{deliverable number} submission {submission number} | {reviewer email}`
  - `drg_program`: parent program
  - `drg_deliverable`: parent deliverable
  - `drg_document`: new document
  - `drg_submissionnumber`: calculated number
  - `drg_revieweruser`: reviewer user
  - `drg_revieweremail`: reviewer email
  - `drg_decision`: Pending
  - `drg_duedate`: new document `drg_reviewduedate`
  - `drg_iscurrent`: Yes
- List older current approvals for the deliverable:
  - Action: Dataverse `List rows`
  - Table name: `drg_approvals`
  - Filter rows: `_drg_deliverable_value eq @{outputs('Get_parent_deliverable')?['body/drg_deliverableid']} and drg_iscurrent eq true`
- For each older approval that is not one of the approvals just created, update the approval:
  - Action: Dataverse `Update a row`
  - Table name: `drg_approvals`
  - Row ID: current item `drg_approvalid`
  - `drg_iscurrent`: No
- Send notification to each external reviewer:
  - Action: Office 365 Outlook `Send an email (V2)`, Teams `Post message`, or your selected notification connector
  - include program name/number
  - deliverable title/number
  - document link
  - review due date if provided

Notes:

- This is the core submission flow.
- The app should prevent non-PDF uploads before the Dataverse row is created.

## 6. External Reviewer Downloads Submission

Flow type: Automated cloud flow

Trigger:

- Dataverse: When a row is added, modified, or deleted
- Change type: Added
- Table name: `drg_documentaccesslogs`
- Scope: Organization
- Filter rows: `statecode eq 0`
- Trigger condition:
  - `drg_action = Download` or `drg_action = View`
  - actor has `External Reviewer` access

Actions:

- Get the access log row:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_documentaccesslogs`
  - Row ID: `drg_documentaccesslog` from the trigger
- Get related document:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_documents`
  - Row ID: `_drg_document_value` from the access log row
- Get related deliverable:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_deliverables`
  - Row ID: `_drg_deliverable_value` from the document row
- List active external reviewer access for the actor:
  - Action: Dataverse `List rows`
  - Table name: `drg_programaccesses`
  - Filter rows: `_drg_program_value eq @{outputs('Get_related_document')?['body/_drg_program_value']} and drg_email eq '@{toLower(outputs('Get_the_access_log_row')?['body/drg_actoremail'])}' and drg_isactive eq true`
  - Row count: `1`
- Continue only if:
  - Action: Control `Condition`
  - `drg_documentrole = DRG Submission`
  - `drg_iscurrentversion = Yes`
  - `drg_status = Submitted`
  - the active external reviewer access list contains one row
- Update the document:
  - Action: Dataverse `Update a row`
  - Table name: `drg_documents`
  - Row ID: related document row ID
  - `drg_status`: Under Review
  - `drg_viewedby`: actor user if available
  - `drg_viewedbyemail`: actor email
  - `drg_viewedon`: access log occurred date/time
- Update related deliverable:
  - Action: Dataverse `Update a row`
  - Table name: `drg_deliverables`
  - Row ID: related deliverable row ID
  - `drg_status`: In Review
- List the current approval row:
  - Action: Dataverse `List rows`
  - Table name: `drg_approvals`
  - Filter rows: `_drg_document_value eq @{outputs('Get_related_document')?['body/drg_documentid']} and drg_revieweremail eq '@{toLower(outputs('Get_the_access_log_row')?['body/drg_actoremail'])}' and drg_iscurrent eq true`
  - Row count: `1`
- If an approval row is found and decision is blank, update the approval:
  - Action: Dataverse `Update a row`
  - Table name: `drg_approvals`
  - Row ID: first row ID from `List the current approval row`
  - `drg_decision`: Pending

Notes:

- If approval rows are created with `Pending` immediately, the last action may not be needed.

## 7. Reviewer Response PDF Uploaded

Flow type: Automated cloud flow

Trigger:

- Dataverse: When a row is added, modified, or deleted
- Change type: Added
- Table name: `drg_documents`
- Scope: Organization
- Filter rows: `statecode eq 0 and _drg_parentdocument_value ne null`
- Trigger condition:
  - `drg_documentrole = Reviewer Response` or `Signed Approval`

Actions:

- Get the reviewer document row:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_documents`
  - Row ID: `drg_document` from the trigger
- Validate parent document exists:
  - Action: Control `Condition`
  - Condition: `_drg_parentdocument_value` is not empty
  - If blank, terminate the flow as Failed or Cancelled.
- Get parent DRG submission document:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_documents`
  - Row ID: `_drg_parentdocument_value` from the reviewer document
- List the related current approval:
  - Action: Dataverse `List rows`
  - Table name: `drg_approvals`
  - Filter rows: `_drg_document_value eq @{outputs('Get_parent_DRG_submission_document')?['body/drg_documentid']} and drg_revieweremail eq '@{toLower(outputs('Get_the_reviewer_document_row')?['body/drg_uploadedbyemail'])}' and drg_iscurrent eq true`
  - Row count: `1`
- Update reviewer document:
  - Action: Dataverse `Update a row`
  - Table name: `drg_documents`
  - Row ID: reviewer document row ID
  - `drg_program`: parent document program if blank
  - `drg_deliverable`: parent document deliverable if blank
  - `drg_submissionnumber`: parent document submission number
  - `drg_approval`: current approval row
- If document role is `Signed Approval`, update current approval:
  - Action: Dataverse `Update a row`
  - Table name: `drg_approvals`
  - Row ID: current approval row ID
  - `drg_responsedocument`: signed approval document
- If document role is `Reviewer Response`, update current approval:
  - Action: Dataverse `Update a row`
  - Table name: `drg_approvals`
  - Row ID: current approval row ID
  - `drg_responsedocument`: reviewer response document

Notes:

- The reviewer decision flow still controls whether the decision is Approved or Rejected.

## 8. Approval Decision Updated

Flow type: Automated cloud flow

Trigger:

- Dataverse: When a row is added, modified, or deleted
- Change type: Modified
- Table name: `drg_approvals`
- Scope: Organization
- Select columns: `drg_decision,drg_responsedocument,drg_comments`
- Filter rows: `statecode eq 0 and drg_iscurrent eq true`
- Trigger condition:
  - `drg_decision = Approved` or `drg_decision = Rejected`
  - `drg_iscurrent = Yes`

Actions:

- Get the approval row:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_approvals`
  - Row ID: `drg_approval` from the trigger
- Get related document:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_documents`
  - Row ID: `_drg_document_value` from the approval row
- Get related deliverable:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_deliverables`
  - Row ID: `_drg_deliverable_value` from the approval row
- If `drg_decision = Rejected`:
  - Action: Control `Condition`
  - Verify `drg_comments` contains data. If blank, terminate the flow as Failed or Cancelled.
  - Update approval:
    - Action: Dataverse `Update a row`
    - Table name: `drg_approvals`
    - Row ID: approval row ID
    - `drg_decisiondate`: current date/time if blank
  - Update DRG submission document:
    - Action: Dataverse `Update a row`
    - Table name: `drg_documents`
    - Row ID: related document row ID
    - `drg_status`: Returned
  - Update deliverable:
    - Action: Dataverse `Update a row`
    - Table name: `drg_deliverables`
    - Row ID: related deliverable row ID
    - `drg_status`: Returned
  - Notify DRG staff/program owner:
    - Action: Office 365 Outlook `Send an email (V2)`, Teams `Post message`, or your selected notification connector
    - include reviewer comments
    - include reviewer response PDF link if provided
- If `drg_decision = Approved`:
  - Get response document:
    - Action: Dataverse `Get a row by ID`
    - Table name: `drg_documents`
    - Row ID: `_drg_responsedocument_value` from the approval row
  - Verify response document `drg_documentrole` is `Signed Approval`. If not, terminate the flow as Failed or Cancelled.
  - Update approval:
    - Action: Dataverse `Update a row`
    - Table name: `drg_approvals`
    - Row ID: approval row ID
    - `drg_decisiondate`: current date/time if blank
  - Update DRG submission document:
    - Action: Dataverse `Update a row`
    - Table name: `drg_documents`
    - Row ID: related document row ID
    - `drg_status`: Reviewed
  - Update deliverable:
    - Action: Dataverse `Update a row`
    - Table name: `drg_deliverables`
    - Row ID: related deliverable row ID
    - `drg_status`: Pending Acknowledgment
    - `drg_lastapprovedon`: current date/time
  - Notify DRG staff/program owner:
    - Action: Office 365 Outlook `Send an email (V2)`, Teams `Post message`, or your selected notification connector
    - signed approval is ready for acknowledgment

Notes:

- The app should prevent Approved without signed PDF and Rejected without comments before the row is saved.
- This flow is the backup enforcement and status rollup.

## 9. DRG Acknowledges Signed Approval

Flow type: Instant cloud flow

Trigger:

- Manually triggered from the app by DRG staff or program owner
- Inputs:
  - `drg_deliverable` row ID
  - accepted `DRG Submission` document row ID
  - signed approval document row ID

Actions:

- Get deliverable:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_deliverables`
  - Row ID: manual trigger input `drg_deliverable`
- Get accepted DRG submission document:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_documents`
  - Row ID: manual trigger input accepted DRG submission document row ID
- Get signed approval document:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_documents`
  - Row ID: manual trigger input signed approval document row ID
- Validate:
  - Action: Control `Condition`
  - deliverable status is `Pending Acknowledgment`
  - signed approval document role is `Signed Approval`
  - user is DRG staff, program owner, or DRG admin
  - If any validation fails, terminate the flow as Failed or Cancelled.
- Update accepted DRG submission document:
  - Action: Dataverse `Update a row`
  - Table name: `drg_documents`
  - Row ID: accepted DRG submission document row ID
  - `drg_status`: Final
- Update signed approval document:
  - Action: Dataverse `Update a row`
  - Table name: `drg_documents`
  - Row ID: signed approval document row ID
  - `drg_status`: Final or Reviewed
- Update deliverable:
  - Action: Dataverse `Update a row`
  - Table name: `drg_deliverables`
  - Row ID: deliverable row ID
  - `drg_status`: Complete
  - `drg_isclosed`: Yes
  - `drg_acknowledgedby`: triggering user
  - `drg_acknowledgedbyemail`: triggering user email
  - `drg_acknowledgedon`: current date/time
- Create document access log row:
  - Action: Dataverse `Add a new row`
  - Table name: `drg_documentaccesslogs`
  - `drg_name`: `{deliverable number} acknowledged`
  - `drg_document`: signed approval document
  - `drg_program`: deliverable program
  - `drg_actoruser`: triggering user if available
  - `drg_actorname`: triggering user name
  - `drg_actoremail`: triggering user email
  - `drg_action`: Acknowledge
  - `drg_occurredon`: current date/time
  - `drg_source`: Web App
- Notify external reviewer(s) and DRG staff that the deliverable is complete:
  - Action: Office 365 Outlook `Send an email (V2)`, Teams `Post message`, or your selected notification connector

Notes:

- This should be an explicit user action, not automatic on approval.

## 10. Reviewer Response Viewed By DRG

Flow type: Automated cloud flow

Trigger:

- Dataverse: When a row is added, modified, or deleted
- Change type: Added
- Table name: `drg_documentaccesslogs`
- Scope: Organization
- Filter rows: `statecode eq 0`
- Trigger condition:
  - `drg_action = Download` or `drg_action = View`
  - actor is DRG staff/program owner/admin

Actions:

- Get access log row:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_documentaccesslogs`
  - Row ID: `drg_documentaccesslog` from the trigger
- Get related document:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_documents`
  - Row ID: `_drg_document_value` from the access log row
- Continue only if the document role is Reviewer Response:
  - Action: Control `Condition`
  - Condition: related document `drg_documentrole` is equal to Reviewer Response
- Update reviewer response document:
  - Action: Dataverse `Update a row`
  - Table name: `drg_documents`
  - Row ID: related document row ID
  - `drg_status`: Viewed
  - `drg_viewedby`: actor user if available
  - `drg_viewedbyemail`: actor email
  - `drg_viewedon`: access log occurred date/time

## 11. Review Due Date Overdue Check

Flow type: Scheduled cloud flow

Trigger:

- Recurrence
- Suggested cadence: once per day, early morning

Actions:

- List overdue approvals:
  - Action: Dataverse `List rows`
  - Table name: `drg_approvals`
  - Filter rows: `drg_iscurrent eq true and drg_decision eq <Pending choice value> and drg_duedate lt @{utcNow()}`
- For each approval:
  - Get related document:
    - Action: Dataverse `Get a row by ID`
    - Table name: `drg_documents`
    - Row ID: `_drg_document_value` from the approval row
  - Get related deliverable:
    - Action: Dataverse `Get a row by ID`
    - Table name: `drg_deliverables`
    - Row ID: `_drg_deliverable_value` from the approval row
  - If document is not already Final, Returned, or Reviewed, update the document:
    - Action: Dataverse `Update a row`
    - Table name: `drg_documents`
    - Row ID: related document row ID
    - `drg_status`: Overdue - Waiting on Reviewer
  - If deliverable is not Complete, update the deliverable:
    - Action: Dataverse `Update a row`
    - Table name: `drg_deliverables`
    - Row ID: related deliverable row ID
    - `drg_status`: Overdue - Waiting on Reviewer
  - Notify reviewer and DRG staff/program owner:
    - Action: Office 365 Outlook `Send an email (V2)`, Teams `Post message`, or your selected notification connector

Notes:

- This handles the optional approval due date on the submitted document/review request.

## 12. Deliverable Due Date Overdue Check

Flow type: Scheduled cloud flow

Trigger:

- Recurrence
- Suggested cadence: once per day, early morning

Actions:

- List overdue deliverables:
  - Action: Dataverse `List rows`
  - Table name: `drg_deliverables`
  - Filter rows: `drg_duedate lt @{utcNow()} and statecode eq 0`
- For each deliverable:
  - Skip if `drg_status` is Complete.
  - Determine blocking party:
    - Action: Control `Condition` or `Switch`
    - if status is `Submitted`, `In Review`, or document/approval is pending, use `Overdue - Waiting on Reviewer`
    - if status is `Returned`, `Pending Acknowledgment`, or `Not Submitted`, use `Overdue - Waiting on DRG`
  - Update deliverable:
    - Action: Dataverse `Update a row`
    - Table name: `drg_deliverables`
    - Row ID: current item `drg_deliverableid`
    - `drg_status`: matching overdue status
  - Notify the blocking party and program owner:
    - Action: Office 365 Outlook `Send an email (V2)`, Teams `Post message`, or your selected notification connector

Notes:

- This handles the overall deliverable due date, not the reviewer-specific due date.

## 13. Program Access Revoked

Flow type: Automated cloud flow

Trigger:

- Dataverse: When a row is added, modified, or deleted
- Change type: Modified
- Table name: `drg_programaccesses`
- Scope: Organization
- Select columns: `drg_isactive`
- Filter rows: `statecode eq 0 and drg_isactive eq false`
- Trigger condition:
  - `drg_isactive = No`

Actions:

- Get access row:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_programaccesses`
  - Row ID: `drg_programaccess` from the trigger
- Check whether `drg_revokedon` is blank:
  - Action: Control `Condition`
  - Condition: `drg_revokedon` is equal to null
- If yes, update access row:
  - Action: Dataverse `Update a row`
  - Table name: `drg_programaccesses`
  - Row ID: access row ID
  - `drg_revokedon`: current date/time
  - `drg_revokedby`: triggering user if available
  - `drg_revokedbyemail`: triggering user email if available
- Optional: notify program owner that access was revoked:
  - Action: Office 365 Outlook `Send an email (V2)`, Teams `Post message`, or your selected notification connector

## 14. Document Access Log Created

Flow type: Automated cloud flow

Trigger:

- Dataverse: When a row is added, modified, or deleted
- Change type: Added
- Table name: `drg_documentaccesslogs`
- Scope: Organization
- Filter rows: `statecode eq 0`

Actions:

- Get access log row:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_documentaccesslogs`
  - Row ID: `drg_documentaccesslog` from the trigger
- Get related document:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_documents`
  - Row ID: `_drg_document_value` from the access log row
- Get related program:
  - Action: Dataverse `Get a row by ID`
  - Table name: `drg_programs`
  - Row ID: `_drg_program_value` from the access log row if present, otherwise `_drg_program_value` from the document row
- If the access log is missing `drg_program`, update log from document:
  - Action: Dataverse `Update a row`
  - Table name: `drg_documentaccesslogs`
  - Row ID: access log row ID
  - `drg_program`: related document program
- Optional: forward event to reporting/analytics destination:
  - Action: HTTP, Power BI, or your selected reporting connector

Notes:

- This is a general audit/logging helper. The reviewer download and reviewer response viewed flows can be separate flows or child branches from this one.

## Recommended Build Order

1. `Program Owner Access Sync`
2. `Deliverable Type Normalize`
3. `Program Access Normalize`
4. `DRG Submission Created`
5. `External Reviewer Downloads Submission`
6. `Reviewer Response PDF Uploaded`
7. `Approval Decision Updated`
8. `DRG Acknowledges Signed Approval`
9. `Review Due Date Overdue Check`
10. `Deliverable Due Date Overdue Check`
11. `Program Archive`
12. `Program Access Revoked`
13. `Reviewer Response Viewed By DRG`
14. `Document Access Log Created`

## Implementation Notes

- Prefer Dataverse trigger conditions so flows do not run on unrelated updates.
- Use environment variables for app URLs, SharePoint site/library IDs, and notification sender details.
- Use connection references owned by a service account, not an individual student/user account.
- Use concurrency control carefully on document submission flows so two uploads do not assign the same submission number.
- Keep user-facing validation in the app where possible, and keep Power Automate as backup enforcement for cross-table updates.
