# Agent notes (StrategyHub)

## Repo layout

- **This workspace is not a monorepo.** Treat **Cloudflare Worker** code and the **GitHub Pages** site as **separate git repos / remotes** unless the user says otherwise.
- **`docs/`** on disk (outside this repo) is documentation; it is **not** a deploy target and **not** a third “docs remote.” Do not invent docs-only commits, root `.gitignore` hacks, or monorepo assumptions for it.

## Commit messages

- Optional commit-message scratch files should hold **copy-paste message bodies only** (no lectures). Do not bloat them with workflow essays.
- Do **not** tell the user to commit scratch commit-message files as part of shipping features.

## Deploy reality

- Worker and Pages typically **deploy separately** even when paths live under one checkout on a dev machine.
