## ADDED Requirements

### Requirement: Scoped project registry

The system SHALL expose active projects and artifacts only after authentication and SHALL preserve the project's tenant identifier on every related record.

#### Scenario: Group related artifacts

- **GIVEN** a client has a landing, analysis, CMS, and alternate implementation
- **WHEN** the operator opens the project
- **THEN** the system shows one project with separately typed artifacts

#### Scenario: Reject inconsistent artifact scope

- **GIVEN** an artifact payload names a tenant different from its project
- **WHEN** the API validates the mutation
- **THEN** the write is rejected without changing the database

### Requirement: Recoverable CRUD

The system SHALL support creating, reading, updating, and archiving projects and artifacts.

#### Scenario: Archive a project

- **WHEN** the operator confirms project archival
- **THEN** the project disappears from the active catalog and remains in audit history
