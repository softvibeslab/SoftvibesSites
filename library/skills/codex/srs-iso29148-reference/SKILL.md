---
name: srs-iso29148-reference
description: Use as a lightweight ISO/IEC/IEEE 29148 SRS reference and example companion when drafting, reviewing, or comparing Software Requirements Specifications, especially together with problem-based-srs outputs.
license: local-reference
metadata:
  source: SRS-Software-Requirements-Specification
---

# SRS ISO 29148 Reference

Use this skill when the user asks for a classic Software Requirements Specification format, ISO/IEC/IEEE 29148-style structure, or an example SRS to compare against Problem-Based SRS artifacts.

## How To Use

1. Use `problem-based-srs` for the primary workflow when discovering requirements from business problems.
2. Use this skill as a reference/checklist after or during SRS drafting.
3. Keep DevhubVibes business/spec documentation in Spanish unless the target stakeholder requires English.
4. Do not replace traceability with generic SRS sections. Preserve the chain `CP -> CN -> FR/NFR`.

## Reference Files

- Read `references/farmbot-srs-outline.md` when you need an ISO-style SRS outline or FarmBot example structure.

## Recommended DevhubVibes Mapping

| Problem-Based SRS | ISO-style SRS Section |
|---|---|
| Business Context | Introduction, scope, stakeholder characteristics, constraints |
| Customer Problems | Purpose, current limitations, business motivation |
| Software Glance | System overview, system perspective, external interfaces |
| Customer Needs | High-level capabilities and stakeholder needs |
| Software Vision | System functions, architecture overview, design constraints |
| Functional Requirements | Specific requirements / functions |
| Non-Functional Requirements | System attributes |
| Zigzag Validator | Traceability matrix and completeness review |

## Output Guidance

When asked to create an SRS for DevhubVibes or Android/Ajover work:

- Prefer `MA Vibes/ecosystem-360/specs/YYYY-MM-DD-slug/` for initiatives larger than two days.
- Include RACI and TRUST 5 evidence when the SRS feeds implementation.
- Include measurable acceptance criteria for each FR/NFR.
- Cite source files or graphify nodes when deriving requirements from reverse engineering.
