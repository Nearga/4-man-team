#!/usr/bin/env bash
set -euo pipefail

BACKEND="${FOUR_MAN_TEAM_BACKEND:-codex}"
PROMPT="Read .4-man-team/config.yaml and .4-man-team/prompts/orvo.md. You are Orvo. Ask me for the task."

case "${BACKEND}" in
  codex)
    printf '%s\n' "${PROMPT}"
    exec codex
    ;;
  gemini)
    exec gemini --prompt "${PROMPT}"
    ;;
  opencode)
    exec opencode run --prompt "${PROMPT}"
    ;;
  *)
    printf 'Unknown FOUR_MAN_TEAM_BACKEND: %s\n' "${BACKEND}" >&2
    printf 'Supported backends: codex, gemini, opencode\n' >&2
    exit 1
    ;;
esac
