# Dataverse Security Roles

This document maps the DRG Microsoft Entra groups to custom Dataverse security roles for the DRG IMS prototype.

The reusable part of this setup is the custom security roles. The Dataverse group teams must be recreated or rebound when the project moves to the final tenant because each group team points to a tenant-specific Entra group object ID.

## Entra Group to Dataverse Role Mapping

| Entra group           | Dataverse group team membership type | Custom Dataverse role |
| --------------------- | ------------------------------------ | --------------------- |
| `drg_admins`          | Members                              | DRG Admin             |
| `drg_program_owners`  | Members                              | DRG Program Owner     |
| `drg_staff`           | Members                              | DRG Staff             |
| `external_reviewers`  | Guests                               | DRG External Reviewer |

## Permission Scope Legend

| Scope            | Meaning                                                   |
| ---------------- | --------------------------------------------------------- |
| None             | No table privilege.                                       |
| User             | Records owned by the user or a team the user belongs to.  |
| Business Unit    | Records in the user's business unit.                      |
| Parent: Child BU | Records in the user's business unit and child units.      |
| Organization     | All records in the environment.                           |

For a single-business-unit prototype, Business Unit and Organization can feel similar in practice. Use Organization only when the role is intentionally allowed to see all records in the environment.

## Recommended Role Setup

Use these values when creating the custom roles in Power Platform admin center under Environment > Settings > Users + permissions > Security roles.

Keep delete privileges conservative because the data model expects status fields and active flags to retire records instead of deleting history.

### DRG Admin

| Field                            | Value                                                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role Name                        | `DRG Admin`                                                                                                                                                                                             |
| Description                      | Administrative role for managing DRG application data, programs, access records, deliverables, documents, approvals, audit history, and configuration/reference tables.                                  |
| Applies To                       | DRG IMS / DRG Realtime Dashboard                                                                                                                                                                        |
| Summary of Core Table Privileges | Full organization-level access to DRG custom tables, including programs, program access, deliverables, documents, approvals, sites, deliverable types, and document access logs. |
| When role is assigned to a Team  | Team member gets all team privileges by default.                                                                                                                                                         |
| Member's privilege inheritance   | Direct User (Basic) access level and Team privileges                                                                                                                                                     |

| Dataverse table          | Create       | Read         | Write        | Delete | Append       | Append To    | Assign       | Share        |
| ------------------------ | ------------ | ------------ | ------------ | ------ | ------------ | ------------ | ------------ | ------------ |
| `contact`                | None         | None         | None         | None   | None         | None         | None         | None         |
| `drg_approval`           | Organization | Organization | Organization | None   | Organization | Organization | Organization | Organization |
| `drg_deliverable`        | Organization | Organization | Organization | None   | Organization | Organization | Organization | Organization |
| `drg_deliverabletype`    | Organization | Organization | Organization | None   | Organization | Organization | Organization | Organization |
| `drg_document`           | Organization | Organization | Organization | None   | Organization | Organization | Organization | Organization |
| `drg_documentaccesslog`  | Organization | Organization | Organization | None   | Organization | Organization | Organization | Organization |
| `drg_program`            | Organization | Organization | Organization | None   | Organization | Organization | Organization | Organization |
| `drg_programaccess`      | Organization | Organization | Organization | None   | Organization | Organization | Organization | Organization |
| `drg_programsite`        | Organization | Organization | Organization | None   | Organization | Organization | Organization | Organization |
| `systemuser`             | None         | Organization | None         | None   | None         | Organization | None         | None         |

Notes:

- Program creation is restricted to DRG admins by the data model.
- Prefer status changes and inactive flags over deleting business records.
- Use the full DRG Admin role for app/data administration. Use Dataverse System Administrator only for environment/platform administration.

### DRG Program Owner

| Field                            | Value                                                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role Name                        | `DRG Program Owner`                                                                                                                                                                                     |
| Description                      | Program management role for users responsible for assigned programs. Program owners can view and manage program records, deliverables, reviewer access, documents, approvals, audit history, and site information for programs they own or are granted access to. |
| Applies To                       | DRG IMS / DRG Realtime Dashboard                                                                                                                                                                        |
| Summary of Core Table Privileges | Read access to assigned DRG program data and audit history, with create/update permissions for program access, deliverables, documents, approvals, and site records needed to manage assigned programs. Program-specific enforcement should be handled by ownership, sharing, or app/flow checks against `drg_programaccess`. |
| When role is assigned to a Team  | Team member gets all team privileges by default.                                                                                                                                                         |
| Member's privilege inheritance   | Direct User (Basic) access level and Team privileges                                                                                                                                                     |

| Dataverse table          | Create | Read         | Write | Delete | Append        | Append To     | Assign | Share |
| ------------------------ | ------ | ------------ | ----- | ------ | ------------- | ------------- | ------ | ----- |
| `contact`                | None   | None         | None  | None   | None          | None          | None   | None  |
| `drg_approval`           | User   | Organization | User  | None   | Business Unit | Business Unit | User   | User  |
| `drg_deliverable`        | User   | Organization | User  | None   | Business Unit | Business Unit | User   | User  |
| `drg_deliverabletype`    | None   | Organization | None  | None   | Organization  | Organization  | None   | None  |
| `drg_document`           | User   | Organization | User  | None   | Business Unit | Business Unit | User   | User  |
| `drg_documentaccesslog`  | User   | User         | None  | None   | User          | User          | None   | None  |
| `drg_program`            | None   | Organization | User  | None   | Business Unit | Business Unit | User   | User  |
| `drg_programaccess`      | User   | Organization | User  | None   | Business Unit | Business Unit | User   | User  |
| `drg_programsite`        | User   | Organization | User  | None   | Business Unit | Business Unit | User   | User  |
| `systemuser`             | None   | Organization | None  | None   | None          | Organization  | None   | None  |

Notes:

- Program owners can create and revoke access rows only for programs they own or manage. Dataverse role scopes alone do not understand "owner of the related program", so enforce this with ownership/sharing plus app or Power Automate checks.
- Program owners should be able to read audit rows for every program they are assigned to, not only audit rows they personally created.
- To make User-level read on `drg_documentaccesslog` work for assigned-program audit visibility, each audit row should be owned by or shared with the same program owner/team/access team that owns or can view the related program. If that ownership model is not implemented, use app/API filtering against `drg_programaccess` before showing audit data.
- Revoking program access should update `drg_isactive` and stamp revoke fields instead of deleting rows.

### DRG Staff

| Field                            | Value                                                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role Name                        | `DRG Staff`                                                                                                                                                                                             |
| Description                      | Internal staff role for working with assigned DRG programs, managing deliverables, uploading DRG submission documents, acknowledging approved documents, viewing assigned-program audit history, and maintaining deliverable type values. |
| Applies To                       | DRG IMS / DRG Realtime Dashboard                                                                                                                                                                        |
| Summary of Core Table Privileges | Read access to assigned program data and audit history, create/update access for deliverables and DRG submission documents, read access to approvals and reviewer responses, and limited create/update access to deliverable type records. |
| When role is assigned to a Team  | Team member gets all team privileges by default.                                                                                                                                                         |
| Member's privilege inheritance   | Direct User (Basic) access level and Team privileges                                                                                                                                                     |

| Dataverse table          | Create       | Read         | Write | Delete | Append       | Append To    | Assign | Share |
| ------------------------ | ------------ | ------------ | ----- | ------ | ------------ | ------------ | ------ | ----- |
| `contact`                | None         | None         | None  | None   | None         | None         | None   | None  |
| `drg_approval`           | User         | User         | None  | None   | User         | User         | None   | None  |
| `drg_deliverable`        | User         | User         | User  | None   | User         | User         | None   | None  |
| `drg_deliverabletype`    | Organization | Organization | User  | None   | Organization | Organization | None   | None  |
| `drg_document`           | User         | User         | User  | None   | User         | User         | None   | None  |
| `drg_documentaccesslog`  | User         | User         | None  | None   | User         | User         | None   | None  |
| `drg_program`            | None         | User         | None  | None   | User         | User         | None   | None  |
| `drg_programaccess`      | None         | User         | None  | None   | User         | User         | None   | None  |
| `drg_programsite`        | User         | User         | User  | None   | User         | User         | None   | None  |
| `systemuser`             | None         | Organization | None  | None   | None         | Organization | None   | None  |

Notes:

- DRG staff need create/update access for deliverables and DRG Submission documents because they work assigned programs and upload submissions.
- DRG staff should be able to read audit rows for every program they are assigned to, not only audit rows they personally created.
- To make User-level read on `drg_documentaccesslog` work for assigned-program audit visibility, each audit row should be owned by or shared with the same staff/team/access team that owns or can view the related program. If that ownership model is not implemented, use app/API filtering against `drg_programaccess` before showing audit data.
- DRG staff can create deliverable type records, but should generally set records inactive instead of deleting them.
- DRG staff read approval status but should not directly alter reviewer decisions.

### DRG External Reviewer

| Field                            | Value                                                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role Name                        | `DRG External Reviewer`                                                                                                                                                                                 |
| Description                      | Guest reviewer role for external users who review assigned deliverables, download DRG submissions, submit approval decisions, comments, response PDFs, and signed approval PDFs for programs where they have active access. |
| Applies To                       | DRG IMS / DRG Realtime Dashboard                                                                                                                                                                        |
| Summary of Core Table Privileges | Minimal read access to assigned program, deliverable, and document metadata; create/update access only for the reviewer's approval records, reviewer response documents, signed approval documents, and access log entries. Program-specific enforcement should be handled by ownership, sharing, or app/flow checks against `drg_programaccess`. |
| When role is assigned to a Team  | Team member gets all team privileges by default.                                                                                                                                                         |
| Member's privilege inheritance   | Direct User (Basic) access level and Team privileges                                                                                                                                                     |

| Dataverse table          | Create | Read         | Write | Delete | Append | Append To | Assign | Share |
| ------------------------ | ------ | ------------ | ----- | ------ | ------ | --------- | ------ | ----- |
| `contact`                | None   | None         | None  | None   | None   | None      | None   | None  |
| `drg_approval`           | None   | User         | User  | None   | User   | User      | None   | None  |
| `drg_deliverable`        | None   | User         | None  | None   | User   | User      | None   | None  |
| `drg_deliverabletype`    | None   | Organization | None  | None   | None   | None      | None   | None  |
| `drg_document`           | User   | User         | User  | None   | User   | User      | None   | None  |
| `drg_documentaccesslog`  | User   | User         | None  | None   | User   | User      | None   | None  |
| `drg_program`            | None   | User         | None  | None   | User   | User      | None   | None  |
| `drg_programaccess`      | None   | User         | None  | None   | None   | None      | None   | None  |
| `drg_programsite`        | None   | User         | None  | None   | User   | User      | None   | None  |
| `systemuser`             | None   | User         | None  | None   | None   | User      | None   | None  |

Notes:

- External reviewers should generally read only active assignments.
- External reviewers create Reviewer Response and Signed Approval documents only for assigned review work.
- External reviewers update their own approval decision, comments, response document, and signed approval document.
- SharePoint file permissions must align with these Dataverse permissions.

## Lookup and Relationship Privileges

Dataverse lookups commonly require both sides of a relationship to have privileges:

- **Append** on the record being linked from.
- **Append To** on the record being linked to.

Examples:

- Creating a `drg_document` linked to a `drg_deliverable` usually requires Append on `drg_document` and Append To on `drg_deliverable`.
- Creating a `drg_programaccess` row linked to a `drg_program` and `systemuser` usually requires Append on `drg_programaccess` and Append To on the related parent records.
- Creating a `drg_approval` linked to `drg_program`, `drg_deliverable`, and `drg_document` requires the appropriate Append and Append To privileges across those tables.

## System Table Access

Each role also needs the minimum privileges required to open the model-driven app and resolve user lookups.

Recommended setup:

- Turn on **Include App Opener privileges for running Model-Driven apps** when creating each custom role.
- Keep `systemuser` read access because the model uses lookups to `systemuser` for creators, owners, assigned staff, reviewers, uploaders, viewers, and grant/revoke users.
- Keep `Append To` on `systemuser` where the role creates records that reference a user lookup, such as `drg_programaccess.drg_user`, `drg_approval.drg_revieweruser`, or `drg_document.drg_uploadedby`.
- `contact` is not used by the current data model. External reviewers are Entra B2B guest users, so they appear as Dataverse users in `systemuser`, not as `contact` rows. Leave `contact` as None unless you add a separate external reviewer directory or customer/contact management feature.
- If the app uses saved views, dashboards, charts, or personal settings, keep the default app opener/basic user privileges created by the role wizard.

## Tenant Migration Notes

When moving from the development tenant to the final tenant:

1. Export these custom security roles in a solution.
2. Import the solution into the final tenant environment.
3. Recreate the Dataverse group teams for the final tenant's Entra groups.
4. Assign the imported roles to the new Dataverse group teams.
5. Re-test with one user from each group, especially one guest external reviewer.
