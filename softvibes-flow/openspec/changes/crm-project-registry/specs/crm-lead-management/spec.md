## ADDED Requirements

### Requirement: Lead CRUD

The system SHALL support tenant-scoped lead creation, reading, editing, stage movement, and archival.

#### Scenario: Create a lead

- **GIVEN** an authenticated operator and an active project
- **WHEN** valid lead data is submitted
- **THEN** the lead is persisted under the project's tenant and an audit event is recorded

#### Scenario: Inspect lead detail

- **WHEN** an operator selects a lead
- **THEN** the system shows contact summary, project, stage, opportunity, next action, activities, and calendar events

#### Scenario: Archive a lead

- **WHEN** an operator confirms lead archival
- **THEN** the lead is removed from active views without deleting its history

### Requirement: Consent-aware contact metadata

The system SHALL store source, consent state, and allowed contact channel separately from pipeline stage.

#### Scenario: Missing consent

- **GIVEN** a lead has unknown consent
- **THEN** the detail view labels consent as unknown and does not offer an automatic outreach action
