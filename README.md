# Four-Man Team

Four-Man Team is a reusable project template for running one visible AI controller over multiple coding agents.

Inspired by [russelleNVy/three-man-team](https://github.com/russelleNVy/three-man-team). This version adds agent routing (agents are set in config, per task type) and a fourth **Observer** agent that reviews logs after task closure and suggests improvements.

The intended daily workflow:

1. Open the project in Superset.
2. Launch the custom `Arch` agent.
3. Give Arch the task.
4. Arch classifies the task and proposes a flow.
5. For nontrivial work, Arch asks for confirmation.
6. Arch dispatches planning, execution, and review through configured model priority lists.
7. After review and task closure, Arch calls Observer to inspect logs and suggest process improvements.

## Install Into A Project

Copy `template/.arch/` into a target project root:

```text
target-project/
  .arch/
    config.yaml
    prompts/
    handoff/
```

Then configure Superset to launch Arch with the target project as the working directory. See [Superset Setup](docs/Superset Setup.md).

## Development

Tests use `bun:test` and are split by feature. See [Testing](docs/Testing.md).

## Main Guarantees

- One user-facing agent: Arch.
- Separate prompts from model choices.
- Use strong models where judgment matters.
- Use cheaper models where work is bounded.
- Do not let the exact execution model review its own work.
- Run Observer after Reviewer for closed tasks.
- Preserve task state in Markdown handoff files.

## V1 Runtime Assumption

V1 can be run manually by Arch using the prompt/config files. A future router CLI can read `.arch/config.yaml` and invoke Codex, Gemini CLI, OpenCode, or Mastra Code automatically.
