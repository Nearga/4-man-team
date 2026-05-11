# Deployment

Four-Man Team can deploy its reusable `src/` files into local projects as `.4-man-team/`.

Local project paths stay in `deployment/projects.local.json`. That file is ignored by Git. Keep the script and example config public.

## Setup

Copy the example config:

```bash
cp deployment/projects.example.json deployment/projects.local.json
```

Edit `deployment/projects.local.json`:

```json
{
  "projects": [
    {
      "name": "my-project",
      "path": "/absolute/local/path/to/project",
      "enabled": true
    }
  ]
}
```

## Commands

```bash
npm run deploy:dry
npm run deploy
npm run deploy:force
```

If `deployment/projects.local.json` is absent, the command exits successfully and prints:

```text
config is missed, create new config at <path>
```

You can also pass a custom config:

```bash
bash scripts/deploy.sh --config deployment/projects.local.json --dry-run
```

## Hash Guard

For every file under `src/`, the script computes SHA-256 for the source and target file.

- Missing target file: create it.
- Matching target file: skip it.
- Different target file: warn and do not overwrite.
- `--force`: overwrite different target files and print every overwritten path.
- `--dry-run`: report actions without writing files.

Unknown files under the target `.4-man-team/` are preserved. Files removed from `src/` are not deleted from targets in v1.

The deployed `.4-man-team/orvo.sh` script is the Superset launcher. It starts the selected backend and supplies the first Orvo prompt.

## Tests

Deployment tests use committed fixtures under `tests/fixtures/`. They do not create temporary target projects or local deployment configs.

```bash
npm test
```
