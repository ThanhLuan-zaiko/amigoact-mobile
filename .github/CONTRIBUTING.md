# Contributing to amigoact-mobile

Thanks for your interest in contributing! This guide explains how to set up the mobile app and its gateway, and how to send changes.

By participating in this project, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## What this repository is

- The Expo (React Native) app in `src/`. It is a native port of the web frontend [`amigoact-fe`](https://github.com/ThanhLuan-zaiko/amigoact-fe), which is the source of truth for screens, Vietnamese copy, permissions, and design. Do not add mobile-only features without an issue that agrees on them first.
- A thin Bun gateway in `gateway/` that sits between the app and the backend. It holds `INTERNAL_API_KEY` so the app never does. It has its own `package.json`, tests, and [AGENTS.md](../gateway/AGENTS.md).

## Prerequisites

- [Bun 1.4.2](https://bun.sh/docs/installation) (pinned in the `packageManager` field of `package.json`)
- Expo Go on a phone, or Android Studio / Xcode for an emulator or a development build
- A running [`amigoact-be`](https://github.com/ThanhLuan-zaiko/amigoact-be) backend for anything past the login screen

## Getting Started

```bash
bun install
cp .env.example .env          # set EXPO_PUBLIC_API_URL to the gateway address
bun run start                 # scan the QR code with Expo Go
```

Start the gateway in a second terminal:

```bash
cd gateway
bun install
cp .env.example .env          # set BACKEND_URL and INTERNAL_API_KEY
bun run dev
```

## Available Scripts

| Command                 | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `bun run start`         | Start Metro                                     |
| `bun run android`       | Start Metro and open Android                    |
| `bun run lint`          | Check the app and the gateway with Biome        |
| `bun run format`        | Format code with Biome                          |
| `bun run typecheck`     | Type check the app                              |
| `bun run test`          | Run the app tests (pure logic only)             |
| `bunx expo-doctor`      | Check dependencies against the Expo SDK         |

## Before You Write Code

Expo and React Native change a lot between SDK releases. Read the docs for the SDK version in `package.json` before you write code, and read [AGENTS.md](../AGENTS.md). Before you build a screen, read its web counterpart and keep the flow, fields, and Vietnamese text the same. When the platform forces a difference, record it in [docs/web-parity.md](../docs/web-parity.md).

## Making Changes

1. Create a branch from the default branch with a short, descriptive name:

   ```bash
   git checkout -b feat/activity-list
   ```

2. Make your changes. Keep each commit focused on one logical change.
3. Run the checks before you push:

   ```bash
   bun run lint
   bun run typecheck
   bun run test
   bunx expo export --platform android --output-dir <a folder outside the repo>
   ```

   If you changed `gateway/`, also run `bun run typecheck` and `bun test` inside `gateway/`.

4. Push your branch and open a pull request.

## Managing Dependencies

Add app packages with `bunx expo install <package>` so the version matches the Expo SDK. Add gateway packages with `bun add` inside `gateway/`. Commit `package.json` and `bun.lock` together. Never commit an npm, yarn, or pnpm lockfile.

## Pull Requests

A good pull request:

- Has a clear title and a description of what changed and why
- Links to the related issue, if one exists
- Includes phone screenshots (light and dark) for visual changes, next to the matching web screen
- Passes lint, type check, tests, and the bundle export
- Stays small enough to review in one sitting

## Reporting Bugs and Requesting Features

Open an issue on GitHub. For bugs, include the device, the OS version, the steps to reproduce, what you expected, and what happened instead.

Do not report security vulnerabilities in public issues. See [SECURITY.md](SECURITY.md) for the private reporting process.
