# Requirements — DRG Information Management System (IMS)

Source: _System Design Document for DRG IMS_, v1.0, February 16 2026, PMO Team.

---

## 1. Problem Statement

DRG currently uses **email** as the primary means of communication between suppliers and customers. The organization manually aggregates email data and stores it in a Microsoft cloud-based system. The IMS replaces this by integrating the correspondence process into a dedicated application where all users can interact with the dataset until it is finalized, then archive it as a permanent record in DRG's quality management system.

## 2. Core Domain

The system manages data related to **CDRLs** (Contract Data Requirements Lists) and **SDRLs** (Subcontract Data Requirements Lists). Any data related to contractual obligations will reside in the IMS. This is a defense-contracting document lifecycle system, not a general-purpose dashboard.

## 3. Platform & Stack (Client-Specified)

The SDD specifies the Microsoft Power Platform as the implementation stack:

| Component               | Role                                                          |
| ----------------------- | ------------------------------------------------------------- |
| **PowerApps**           | User interface — Canvas and Model-Driven apps                 |
| **Power Automate**      | Workflows, approvals, notifications, task assignments         |
| **Microsoft Dataverse** | Primary structured data store (entities, relationships, RBAC) |
| **SharePoint**          | Document storage, version control, metadata tagging           |
| **Azure AD (Entra ID)** | Authentication (SSO), MFA, role-based access control          |

> "DRG current IT solution provides access to all applications needed to implement this software solution. No additional software or hardware is required." — SDD Conclusion

## 4. Intended Audience / User Roles

- **Executive Leadership** — integration details, high-level visibility
- **Program/Project Managers** — system capabilities and timelines
- **Program Management Office (PMO)** — compliance and maintenance
- **End-Users / Customers** — system functionality and day-to-day workflows

## 5. Functional Requirements

### 5.1 Information Management

- Store, process, and retrieve CDRL/SDRL data
- All contractual-obligation data resides in the IMS
- Documents can be downloaded by all users with access
- Documents uploaded once complete (finalization workflow)

### 5.2 User Interface (from SDD wireframes)

- Login screen: username/password, DRG logo, security disclaimer, "Request Access" flow
- Main interface with sidebar navigation:
  - **SOA LMR** (Statement of Work / Labor Mix Report)
  - **CDRL/SDRL** management
  - Additional option slots (expandable)
- **Calendar** showing all dates/deadlines for program requirements
- **Upload Documents** / **Attach Documents** actions
- Responsive across desktop and mobile
- WCAG accessibility compliance
- Corporate branding consistency

### 5.3 Workflow Automation

- Approval processes via Power Automate
- Email notifications on key events
- Data validation on submission
- Triggers: form submissions, Dataverse changes, time-based/scheduled
- Actions: CRUD on records, send notifications, integrate with external APIs
- Error handling: retry logic, logging for failures

### 5.4 Document Management

- SharePoint-backed document libraries
- Version control and metadata tagging
- Upload/download with access control
- Collaboration via Teams/Office 365 integration

### 5.5 Integration

- **Internal**: SharePoint (document management), Microsoft 365 (calendar, email, collaboration)
- **External**: Custom APIs / custom connectors for third-party systems
- **Data migration**: Dataflows or built-in connectors for import/export
- **Middleware**: Power Automate as the orchestration layer

## 6. Data Model (High-Level)

Entities called out in the SDD:

- `User`
- `Document`
- `Record`
- `Approval`

Relationships: one-to-many and many-to-many as needed. Dataverse for structured data, SharePoint for file/document storage.

Data governance: business rules, validations, Dataverse backup, SharePoint versioning, compliance with organizational and legal requirements.

## 7. Security Requirements

- **Authentication**: Azure AD with SSO
- **Authorization**: Role-Based Access Control (RBAC) in Dataverse, scoped by job function
- **MFA**: Enforced via conditional access policies
- **Encryption**: At rest and in transit (industry-standard protocols)
- **Auditing**: Audit logs for all data changes and access patterns
- **Environment isolation**: Separate dev, test, and production environments
- **API security**: OAuth + managed identities for all external/custom connectors
- **Monitoring**: Power Platform Admin Center + Azure Monitor

## 8. Non-Functional Requirements

- **Performance**: Optimize forms and flows, minimize unnecessary data calls; monitor via Power Platform analytics
- **Scalability**: Additional Power Platform licenses + Dataverse capacity; cloud-native scaling
- **Availability**: Microsoft cloud redundancy, disaster recovery plans, aligned with Microsoft SLAs
- **Deployment**: ALM framework, CI/CD via Azure DevOps or GitHub Actions, managed solution packaging
- **Maintenance**: Continuous monitoring, defined support/escalation paths, regular documentation updates, user feedback loops

## 9. Testing Requirements

- **Unit**: Individual PowerApps components and Power Automate flows
- **Integration**: Data flow between PowerApps, Dataverse, SharePoint, and integrated systems
- **UAT**: End-users validate workflows, UI, and overall usability
- **Security**: Vulnerability assessments and penetration tests
- **Environment**: Dedicated test environment mirroring production
- **Metrics**: Performance benchmarks, error rates, user satisfaction scores

## 10. DRG Branding

The SDD includes the DRG logo: an orange/gold swoosh above "DRG" in navy text, with "DELAWARE RESOURCE GROUP" in smaller navy text below. The primary brand color is **navy (#002050)**. UI should use PowerApps styling options for corporate branding consistency.
