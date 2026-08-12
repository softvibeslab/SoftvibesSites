## ADDED Requirements

### Requirement: Explicit operator context
The workspace SHALL display the current product, project, tenant, and preview state in a way that remains understandable while browsing and inspecting workflows.

#### Scenario: Operator opens workspace
- **WHEN** the workspace loads
- **THEN** the operator can identify the current project and tenant before interpreting catalog content

#### Scenario: Operator changes project context
- **WHEN** the operator selects another declared project scope
- **THEN** the catalog and selected detail reset to valid workflows within the new project and tenant scope

### Requirement: Accessible interactive controls
The workspace SHALL provide semantic labels, keyboard-visible focus, non-color status text, and touch targets of at least 44 by 44 CSS pixels for primary interactive controls.

#### Scenario: Keyboard catalog navigation
- **WHEN** the operator navigates the project, search, filter, and workflow controls using the keyboard
- **THEN** each interactive element receives a visible focus indicator and has an accessible name

#### Scenario: Status is not color-only
- **WHEN** a workflow lifecycle or step state is displayed
- **THEN** the state includes readable text in addition to visual color treatment

### Requirement: Responsive workspace layout
The workspace SHALL remain usable without horizontal page scrolling at desktop and narrow mobile viewport widths.

#### Scenario: Desktop inspection
- **WHEN** the viewport provides desktop space
- **THEN** the operator can view the catalog and selected workflow detail together

#### Scenario: Mobile inspection
- **WHEN** the viewport is narrow
- **THEN** the catalog and detail surfaces stack in reading order with controls that remain reachable and legible

### Requirement: Reduced motion preference
The workspace SHALL avoid non-essential animation when the operator requests reduced motion.

#### Scenario: Reduced motion enabled
- **WHEN** the browser reports `prefers-reduced-motion: reduce`
- **THEN** non-essential transitions and animated decorative effects are disabled
