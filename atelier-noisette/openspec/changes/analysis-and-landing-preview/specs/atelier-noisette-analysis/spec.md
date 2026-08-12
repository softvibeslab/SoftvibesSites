## ADDED Requirements

### Requirement: Evidence-backed diagnosis
The analysis SHALL distinguish verified platform observations, product hypotheses, and unknown business facts.

#### Scenario: Public evidence is shown
- **WHEN** the operator opens the analysis
- **THEN** the page identifies Instagram and Threads as public sources and does not imply access to private analytics

#### Scenario: Dynamic social metrics
- **WHEN** follower or post counts are displayed
- **THEN** they include the observation date and are labelled as dynamic platform metadata rather than business outcomes

### Requirement: Analysis-to-landing transformation
The analysis SHALL connect each priority conversion gap to a visible landing behavior.

#### Scenario: Operator reviews the proposed journey
- **WHEN** a finding is inspected
- **THEN** the analysis explains the current friction, supporting evidence, proposed correction, and client input still required

### Requirement: Private preview boundary
The analysis SHALL use `noindex, nofollow`, SHALL not be linked from the customer landing, and SHALL state that crawler guidance is not access control.

#### Scenario: Search crawler reads metadata
- **WHEN** a crawler inspects the analysis page
- **THEN** the page requests no indexing and no link following
