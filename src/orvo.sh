#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="${FOUR_MAN_TEAM_BACKEND:-gemini}"
PROMPT="Read ${SCRIPT_DIR}/config.yaml and ${SCRIPT_DIR}/prompts/orvo.md. You are Orvo. Ask me for the task."

case "${BACKEND}" in
  codex)
    exec codex "${PROMPT}"
    ;;
  gemini)
    exec gemini --prompt-interactive "${PROMPT}"
    ;;
  opencode)
    exec opencode --prompt "${PROMPT}"
    ;;
  *)
    printf 'Unknown FOUR_MAN_TEAM_BACKEND: %s\n' "${BACKEND}" >&2
    printf 'Supported backends: codex, gemini, opencode\n' >&2
    exit 1
    ;;
esac
