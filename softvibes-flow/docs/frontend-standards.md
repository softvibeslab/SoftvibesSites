---
description: Frontend standards for the Softvibes Flow Next.js control plane.
alwaysApply: true
---

# Frontend Standards

## Stack

- Next.js 16 App Router, React 19, and strict TypeScript.
- Prefer React Server Components. Add `"use client"` only for real interaction or browser state.
- Use project-local CSS and CSS custom properties. Do not add a component framework for the preview.
- Use Vitest and React Testing Library for behavior; use browser automation for complete user flows.

## Structure

- Routes and layouts: `src/app/`.
- Domain types, fixtures, selectors, and components: `src/features/<capability>/`.
- Keep server-safe domain logic separate from client components.
- Keep components focused and name them in English; user-facing copy is Spanish.

## UX and Accessibility

- Preserve explicit project/tenant context on every workflow surface.
- Prefer progressive disclosure over dense dashboards. Show only information that helps an operator decide or act.
- Never present preview fixtures as live metrics.
- Use semantic landmarks and headings, visible keyboard focus, descriptive labels, sufficient contrast, and 44px minimum touch targets.
- Support desktop and mobile without horizontal page scrolling.
- Respect `prefers-reduced-motion`.
- Empty and unavailable states must explain what is missing and what action is safe next.

## Data and State

- Use fully typed discriminated unions for statuses and step kinds.
- All workflow records must include `projectId` and `tenantId`.
- Filtering must never broaden beyond the selected project/tenant scope.
- Keep local fixtures deterministic. External reads and writes belong behind typed adapters in later changes.

## Verification

- Follow RED-GREEN-REFACTOR for selectors and interactive behavior.
- Run targeted tests, full tests, typecheck, lint, and production build.
- Verify the main operator flow and empty state in a browser at desktop and mobile widths.
- Check browser console output and keyboard interaction before marking complete.
