---
name: synthetic-simulation-design
description: Design and stage multi-agent synthetic simulations for product pilots, policy rehearsals, market scenarios, and social-system experiments without mistaking generated behavior for real evidence.
---

# Synthetic Simulation Design

Design bounded multi-agent simulations that produce testable hypotheses and safer real-world pilots.

## When to use

Use when the user wants to:

- rehearse a product pilot with synthetic participants;
- compare onboarding, messaging, policy, or operating variants;
- simulate interactions among users, reviewers, sponsors, or institutions;
- prepare seed documents and prediction requirements for tools such as MiroFish;
- identify risks, failure modes, and questions before testing with real people.

Do not use this as a substitute for real user research, A/B testing, forecasting, or causal inference.

## Core workflow

1. Read the current project source of truth and identify the exact decision the simulation should support.
2. Choose one use case. A simulation of the whole product produces narrative noise.
3. State one If/Then/Because hypothesis.
4. Define 2–3 concrete variants that can be compared while holding agent starting conditions stable.
5. Build a balanced synthetic cohort from documented segments, not invented demographics.
6. Add operational actors when routing, review, approval, governance, or capacity affects outcomes.
7. Define a short event sequence and cap rounds to control cost and drift.
8. Require stressed, base, and favorable scenarios.
9. Require observable signals and uncertainties that can be checked in a real pilot.
10. End with a small human-validation plan and a `CONTINUE`, `ADJUST`, or `STOP` decision rule.

## Artifact contract

Prefer three small files:

- `seed/<experiment>.md`: facts, actors, initial event, variants, observables, guardrails.
- `SIMULATION_PROMPT.md`: objective, configuration, questions, scenarios, exact report sections, success criterion.
- `README.md`: load/run steps, round cap, output location, and interpretation limits.

See `references/multi-agent-simulation.md` for the detailed artifact pattern, staging boundary, and verification checklist.

## Cohort design

Each synthetic actor needs:

- stable synthetic ID;
- relevant context and experience level;
- goal and motivation;
- time, device, language, accessibility, or connectivity constraints when relevant;
- learning or decision preference;
- trust/privacy concern;
- likely blocker or failure mode.

Keep differences decision-relevant. Do not decorate agents with demographic detail that cannot change the product decision.

## Guardrails

- Never represent synthetic agents as identified people.
- Never upload private participant data when a distilled synthetic seed is enough.
- Do not invent historical conversion rates, revenue, statistical significance, or causal effects.
- Never declare a winner from synthetic agent counts.
- Label claims as seed fact, assumption, synthetic result, or pending validation.
- Preserve real permission boundaries and human approvals.
- Treat cultural or geographic behavior as a hypothesis, not a stereotype.
- External actions remain human-reviewed.

## Cost boundary

Preparing files and loading them into a UI is staging. If the final start/run action incurs meaningful API cost or the UI displays a cost estimate, obtain explicit user confirmation before executing it. If confirmation is absent, leave the experiment staged and say so plainly.

## Verification

Leave one runnable check that confirms:

- cohort IDs are unique and complete;
- the prompt references the cohort and all variants;
- uncertainty and human-validation language is present;
- README paths resolve;
- runtime configuration exists without printing secret values.

## Common pitfalls

- Simulating multiple product use cases at once.
- Uploading a whole private repository instead of a minimal seed.
- Giving agents unstable personalities across variants.
- Treating vivid narratives as probabilities.
- Letting the simulator invent business metrics.
- Omitting operational bottlenecks such as human review queues.
- Starting a paid run merely because the form is ready.
