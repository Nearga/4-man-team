#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="${FOUR_MAN_TEAM_BACKEND:-gemini}"
CONFIGURED_ORVO_MODEL="$(
  awk '
    /^model_priorities:/ { in_models = 1; next }
    in_models && /^[^[:space:]]/ { in_models = 0 }
    in_models && /^  orvo:/ { in_orvo = 1; next }
    in_orvo && /^  [^[:space:]]/ { in_orvo = 0 }
    in_orvo && /^[[:space:]]*-/ {
      model = $0
      sub(/^[[:space:]]*-[[:space:]]*/, "", model)
      print model
      exit
    }
  ' "${SCRIPT_DIR}/config.yaml"
)"
ORVO_MODEL="${FOUR_MAN_TEAM_ORVO_MODEL:-${CONFIGURED_ORVO_MODEL}}"
PROMPT="Read ${SCRIPT_DIR}/config.yaml and ${SCRIPT_DIR}/prompts/orvo.md. You are Orvo. Your current agent/model log value is Orvo / ${ORVO_MODEL}. Ask me for the task."

case "${BACKEND}" in
  codex)
    exec codex "${PROMPT}"
    ;;
  gemini)
    GEMINI_MODEL="${ORVO_MODEL#gemini:}"
    exec gemini --model "${GEMINI_MODEL}" --prompt-interactive "${PROMPT}"
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
