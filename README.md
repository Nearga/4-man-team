# Four-Man Team

Single-entry agent workflow for Superset.

User talks to **Orvo**. Orvo reads `.4-man-team/config.yaml`, chooses the task flow, asks before nontrivial work, routes agents through configured model priority lists, and writes post-close observations.

Inspired by [russelleNVy/three-man-team](https://github.com/russelleNVy/three-man-team). This version adds model routing and Orvo as orchestrator/observer.

## Install

```bash
npm run deploy
```

Local deployment targets live in ignored file:

```text
deployment/projects.local.json
```

## Superset

Add a terminal preset:

```text
Name: Four-Man Team - Orvo
Working Directory: .
Mode: New Tab
Command:
bash .4-man-team/orvo.sh
```

`orvo.sh` is deployed into each project. It starts Codex by default and injects the first Orvo prompt.

Task prompt:

```text
Task: <your task>
Use Four-Man Team flow.
Classify complexity, show selected flow, and ask before nontrivial execution.
```

Orvo should use:

```text
.4-man-team/config.yaml
.4-man-team/prompts/
.4-man-team/handoff/
```

Temporary backend override:

```bash
FOUR_MAN_TEAM_BACKEND=gemini bash .4-man-team/orvo.sh
FOUR_MAN_TEAM_BACKEND=opencode bash .4-man-team/orvo.sh
```

## Development

```bash
npm test
```
