## ADDED Requirements

### Requirement: Operable pipeline

The system SHALL show active leads grouped by stable pipeline stage and support an accessible stage transition.

#### Scenario: Move a lead

- **WHEN** an authenticated operator moves a lead to a new stage
- **THEN** the lead is persisted in the new stage and the transition is recorded

### Requirement: Calendar management

The system SHALL support creating, editing, listing, and archiving tenant-scoped calendar events linked to a project and optionally a lead.

#### Scenario: Schedule a follow-up

- **WHEN** the operator schedules a valid follow-up for a lead
- **THEN** it appears on the calendar and in that lead's detail
