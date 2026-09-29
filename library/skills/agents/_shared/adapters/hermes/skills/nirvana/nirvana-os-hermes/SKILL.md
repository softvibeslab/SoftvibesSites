---
name: nirvana-os-hermes
description: Hermes runtime ONLY — the Nirvana-OS bridge for Hermes Agent. Every other runtime loads the first-class `nirvana-os` skill instead and must ignore this one. Lists and inspects the user's Nirvana-OS businesses (empresas) and squads and routes production briefs to the harness orchestrator via `nrv dispatch`. Trigger when the user asks "quais são minhas empresas", "quais squads eu tenho", "what businesses/squads do I have", "liste minhas empresas", "o que o nirvana pode fazer", or wants to orchestrate / dispatch / produzir work through Nirvana-OS.
version: 1.0.0
author: nirvana-os
license: SUL-1.0
platforms: [macos, linux]
metadata:
  hermes:
    tags: [nirvana, businesses, empresas, squads, mind-clones, harness, orchestration, orquestracao]
  openclaw:
    # This bridge asks, in its own description, to be ignored by every runtime
    # but Hermes. OpenClaw scans six levels deep, found it under _shared/, and
    # listed it as ready — offering a Hermes-only skill to someone who cannot
    # use it. Prose cannot enforce that; this gate can: the skill appears only
    # where the hermes binary exists.
    requires:
      bins: ["hermes"]
prerequisites:
  commands: [nrv]
---

# Nirvana-OS (Hermes bridge)

This is the Hermes-only bridge. It lives inside `_shared/`, which the installer
links into every runtime's skills directory, so runtimes that discover
`SKILL.md` recursively also see this file: its name is namespaced (`nirvana-os-hermes`)
precisely so it can never collide with the first-class `nirvana-os` skill, which
is the one every non-Hermes runtime must load.

The user runs Nirvana-OS, a Bun-native multi-agent orchestrator with three pillars: **businesses** (empresas — autonomous multi-agent organizations with org charts of employees), **squads** (portable agent teams with workflows), and **mind-clones** (persona DNA injected into employees). The `nrv` CLI is the single entry point. It reads the global registry at `~/businesses/` and `~/squads/`.

Always answer in the user's language (default PT-BR). Run the commands below with your shell tool, then summarize the output for the user. Never invent business or squad names — only report what `nrv` actually prints.

## Discovery — run the command, then report

- "Quais são minhas empresas?" / "What businesses do I have?" / "liste empresas"
  → `nrv list-businesses`            (add `--format=json` only if you need to parse)

- "Quais são meus squads?" / "What squads do I have?" / "liste squads"
  → `nrv list-squads`                (supports `--format=table|json`)

- "Quais mind-clones eu tenho?" / "list mind-clones" / "minhas personas/DNA"
  → `nrv list-clones`                (aliases: `list-mind-clones`; `--format=table|json`)
  → `nrv inspect-clone <slug>`       (details; add `--dna` for DNA layer counts)
  → `nrv ask <clone-slug> "<pergunta>"`  (consult one mind-clone with its DNA injected)

- "O que o Nirvana pode fazer sobre X?" / capability search across all three pillars
  → `nrv search "<topic>"`           (filter with `--kind=business|squad|mind-clone`; `nrv find "<need>"` for routing)

- Web cockpit / visão geral
  → `nrv glance`

- Anything else / full command surface
  → `nrv --help`  (30+ subcommands: dispatch, ask, inspect, audit-view, export, …)

## Orchestration — distinguish scaffolding from execution

Before routing production work, read `nrv --help` and the relevant subcommand's `--help`; installed command contracts can differ from older bridge documentation. Preserve the user's brief and use Nirvana for explicitly requested Nirvana production work.

Observed command contract (verify against installed help):
- `nrv dispatch <business> "<brief>"` scaffolds a run; it does NOT execute it.
- `nrv run <business> "<brief>"` executes with verification and quality gate.
- `nrv auto "<brief>"` executes with automatic business selection.
- `nrv ask <clone> "<question>"` consults a specific mind-clone.

Never describe a scaffold as completed production. Verify actual output artifacts and audit information reported by the run rather than assuming a fixed log location.

## Access and first use — give the usable URL

When the user asks for a link to execute or use Nirvana, prioritize access to the cockpit, not the GitHub repository. Distinguish source-code links from a running local UI. Explain that loopback URLs work only on the host machine and are not public sharing links.

1. Read `nrv glance --help` for current options and defaults.
2. Check or choose the intended project directory: Glance detects project context from the working directory. Do not silently associate unrelated work with the current project.
3. Reuse a verified running cockpit, or start `nrv glance --no-open` as a managed background server when launch is requested. Use `nrv glance` when the user wants the browser opened.
4. Discover the actual URL from process logs or the listening process, then verify its HTTP response before returning it. Never reuse a remembered port without checking it.
5. Return the verified URL first, followed by the local-only caveat and the restart command. Explain the next UI step briefly; opening a panel is not authorization to execute a production brief.

Glance may enable write actions by default. Use `--read-only` for an explicitly browse-only session; do not expose the cockpit publicly as a shortcut to sharing.

See `references/cockpit-and-cli-contract.md` for observed CLI behavior and readiness checks.

## Honest limits in Hermes

Full in-process multi-agent dispatch is richest inside Claude Code (native subagent primitive). In Hermes, the maestro reasoning still works and `nrv` carries the deterministic pieces (routing, list, inspect, verify, quality-gate); employee dispatch degrades to sub-process, the same way it does in the Codex and Gemini adapters. For read-only queries (list / inspect / search) there is no degradation — they work fully here.

## Notes

- Requires the `nrv` CLI on PATH (`command -v nrv`). If missing, tell the user to install Nirvana-OS, do not improvise.
- This skill is a thin bridge: it routes to `nrv`, it does not hold the registry itself.
