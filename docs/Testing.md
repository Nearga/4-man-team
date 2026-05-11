# Testing

Four-Man Team uses `bun:test`.

Reason:

- scripts already run on Bun
- TypeScript works without extra build setup
- no test dependencies are needed
- fixture-only tests fit the no-temp-files policy

## Structure

Tests are split by feature:

```text
tests/
  deploy/
    config.test.ts
    planning.test.ts
  fixtures/
  support/
```

Rules:

- keep one test file per feature area
- use committed fixtures for inputs and expected outputs
- do not create temp projects or generated local configs
- test pure planning logic before write paths

## Command

```bash
npm test
```

