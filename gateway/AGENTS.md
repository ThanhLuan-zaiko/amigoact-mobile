# AGENTS.md

Instructions for AI coding agents working in `amigoact-mobile/gateway/`. These rules override default behavior.

## What this repo is

A thin gateway between the mobile app and the backend (`../../amigoact-be`). The backend refuses every HTTP request without `X-Internal-Key`, and a mobile app is a public client that cannot hold that key. The gateway holds the key, adds it to forwarded requests, and decides what may pass. Details are in `docs/gateway.md`. The decision is recorded in `../docs/architecture.md`.

This folder lives inside the mobile repo but is a separate package: its own `package.json`, `bun.lock`, `tsconfig.json`, and tests. Run its commands from `gateway/`. It must never import from the app (`../src`), and the app must never import from it. Biome is configured once, in the repo root, and covers both.

The gateway has no business logic. It does not read, change, or store request bodies, tokens, or users. Business rules, permissions, validation, and error codes stay in the backend. If you are about to add logic here that decides what a user may do, put it in the backend instead.

## Project structure

- Code lives in `src/`, tests in `tests/`. `src/index.ts` starts the server, `src/app.ts` wires it, and the other files each do one thing (`config`, `allowlist`, `rateLimit`, `headers`, `proxy`, `socket`).
- No runtime dependencies. The gateway uses only Bun built-ins (`Bun.serve`, `fetch`, `WebSocket`). Do not add a runtime dependency without a clear need and the user's approval, because every dependency is attack surface in front of the API.

## Security rules

- `INTERNAL_API_KEY` is read from `.env` (or the process environment in production), checked for at least 32 characters at start, and never logged, returned, or put in an error message.
- Request headers are copied from an allowlist (`src/headers.ts`). Never switch to copying all headers and removing a few. `x-internal-key`, `x-forwarded-*`, `host`, and cookies from the client must never reach the backend.
- A new backend route family needs its first path segment added to `FAMILIES` in `src/allowlist.ts`, and a test. Never allow `/docs`, `/openapi.json`, or `/redoc`, and never allow a wildcard.
- Refuse encoded slashes, dots, backslashes, and NUL in paths. Do not weaken `isAllowedPath`.
- The client IP comes from the socket. `X-Forwarded-For` is trusted only when `TRUST_PROXY=true`, and then only its last entry.
- Do not log request bodies, headers, tokens, tickets, query strings, or IP addresses. Log method, path, status, and duration at most.
- Errors use `{ "detail": "<code>" }`, the same shape as the backend. Codes the gateway adds are `not_found`, `method_not_allowed`, `rate_limited`, `payload_too_large`, `upstream_unavailable`, `upstream_timeout`, `origin_forbidden`, `too_many_sockets`, `upgrade_failed`, and `internal_error`. Each must exist in the mobile app's error table.
- Do not buffer whole bodies in memory. Stream requests and responses (uploads reach 50 MB).

## Language

- Write everything in English: identifiers, comments, docs for code, logs, and commit messages. Exception: `.md` files may be written in Vietnamese.
- Do not use non-ASCII characters in `.ts` files.

## File size limits

Every `.ts` file is at most **350 lines**. When a file approaches the limit, split it into smaller modules.

## Git: never commit, branch, or push without an explicit command

- Do not run `git commit`, `git push`, `git checkout -b`, `git switch -c`, `git branch`, or `git tag`, and do not open a pull request, unless the user asks for that action in the current message.
- When the user asks to commit "per stage" in a message, commit each finished stage locally, one commit per stage, and never push. That permission lasts only for that task.
- Do not stage files with `git add` unless the user asks or a commit was asked for.

## No junk files in the repository

Never create or commit: `node_modules/`, `.env` files (only `.env.example` is allowed, with empty values), log files, `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.bak`, `*.tsbuildinfo`, `coverage/`, scratch scripts, and generated output. Put scratch work in the session scratchpad directory.

## Commands

```bash
bun install                  # install locked dependencies
bun run dev                  # start with reload (needs .env)
bun run start                # start
bun run lint                 # Biome lint and check
bun run format               # Biome format (writes files)
bun run typecheck            # tsc --noEmit
bun test                     # tests
```

## Documentation

- Write detailed documentation in `docs/`, one file per topic. Keep `README.md` short.
- When behavior changes, update the matching file in `docs/` in the same change.

## Testing rules

- Every behavior change comes with tests in `tests/`: unit tests for pure logic (`config`, `allowlist`, `rateLimit`, `headers`), integration tests that start the gateway and a fake backend (`tests/helpers.ts`), and a regression test for every security fix.
- Tests must not touch the network beyond `127.0.0.1` or any real backend.

## Quality gates

There is no CI workflow yet. Until one exists, run these locally before you report a change as done, and report the real results. If a gate fails, fix the code. Do not weaken or skip a gate. Never say CI passes without evidence.

| Gate | Check |
| ---- | ----- |
| 01 | Install with frozen lockfile (`bun install --frozen-lockfile`) |
| 02 | Lint (`bun run lint`) |
| 03 | Format check (`bunx biome format`) |
| 04 | Type check (`bun run typecheck`) |
| 05 | Tests (`bun test`) |
| 06 | Every `.ts` file is at most 350 lines |
| 07 | No non-ASCII in `.ts` files |
| 08 | No junk files tracked, no secrets tracked |
