## ADDED Requirements

### Requirement: Protected operational data

The system SHALL require a valid signed session for all operational reads and writes.

#### Scenario: Unauthenticated request

- **WHEN** a client requests operational data without a valid session
- **THEN** the API returns an authentication error and no data

#### Scenario: Authenticated mutation without CSRF token

- **WHEN** a valid session submits a mutation without its CSRF token
- **THEN** the API rejects the request without changing the database

### Requirement: Structured errors

The system SHALL return errors with a stable code and safe operator-facing message without database or credential details.

#### Scenario: Unexpected server failure

- **WHEN** an operational request fails unexpectedly
- **THEN** the API returns a generic error code and message without connection, query, stack, or credential details
