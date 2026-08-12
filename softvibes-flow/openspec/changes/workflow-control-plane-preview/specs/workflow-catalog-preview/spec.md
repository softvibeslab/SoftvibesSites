## ADDED Requirements

### Requirement: Tenant-scoped workflow catalog
The system SHALL require an explicit project and tenant scope before returning workflow definitions, and optional filters SHALL only narrow that scope.

#### Scenario: Initial scoped catalog
- **WHEN** the operator opens the preview with the MenuVibes project and tenant selected
- **THEN** the catalog shows only workflow definitions whose project and tenant match that selected scope

#### Scenario: Scope remains enforced during search
- **WHEN** the operator enters a search term that also matches a workflow belonging to another project or tenant
- **THEN** the catalog does not expose that out-of-scope workflow

### Requirement: Search and lifecycle filtering
The system SHALL let the operator filter the scoped catalog by a case-insensitive text query and lifecycle status, and SHALL combine active filters.

#### Scenario: Combined search and status filter
- **WHEN** the operator selects a lifecycle status and enters a matching text query
- **THEN** the catalog shows only scoped workflows that satisfy both filters

#### Scenario: Honest empty state
- **WHEN** no scoped workflow satisfies the active filters
- **THEN** the system shows an explanatory empty state and a control to clear filters without inventing results

### Requirement: Workflow definition inspection
The system SHALL let the operator select a workflow and inspect its version, lifecycle status, input, output, ordered steps, approval gates, evidence, and known gaps.

#### Scenario: Inspect selected workflow
- **WHEN** the operator selects a workflow from the catalog
- **THEN** the detail surface displays the selected workflow definition and preserves the visible project and tenant context

#### Scenario: Unknown or unavailable data
- **WHEN** a runtime metric, owner, or evidence field is not available in the preview data
- **THEN** the system displays that information as unavailable or unknown rather than fabricating a value

### Requirement: Approval boundaries remain explicit
The system SHALL classify each workflow's external action as `none`, `outreach`, or `publish`, and SHALL represent human approval before MenuVibes outreach and before any MoneyPrinterV2 publishing or scheduled publishing path shown in the preview.

#### Scenario: MenuVibes outreach approval
- **WHEN** the operator inspects the prospect-to-demo workflow
- **THEN** the detail shows a human approval gate before outreach

#### Scenario: MoneyPrinter publishing approval
- **WHEN** the operator inspects a MoneyPrinterV2 workflow that publishes or schedules publication
- **THEN** the detail shows a human approval gate before publication can proceed

### Requirement: Read-only safety boundary
The preview SHALL NOT expose an action that sends outreach, deploys, publishes, writes to an external system, handles credentials, or executes arbitrary commands.

#### Scenario: Operator reviews approval gate
- **WHEN** the operator inspects an approval step
- **THEN** the system describes the human gate without offering a production execution or approval action

#### Scenario: Embedded project controls remain descriptive
- **WHEN** the operator inspects an artifact that contains a CMS, checklist, build, publish, deploy, call, or messaging control
- **THEN** the preview does not execute or simulate that control and does not mutate canonical files, browser storage, generated output, or external systems
