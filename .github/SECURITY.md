# Security Policy

## Supported Versions

AmigoACT is in early development. Only the latest code on the default branch receives security fixes.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues, pull requests, or discussions.

Report them privately instead:

1. Open the **Security** tab of this repository.
2. Click **Report a vulnerability**.
3. Describe the issue.

A useful report includes:

- A description of the vulnerability and its potential impact
- The affected component (this repository, `amigoact-mobile`: the app or `gateway/`)
- Steps to reproduce, or a proof of concept
- The version or commit you tested
- A suggested fix, if you have one

## What to Expect

- **Acknowledgement:** We aim to respond within 7 days.
- **Assessment:** We aim to confirm or reject the report within 14 days and will keep you updated on progress.
- **Fix and disclosure:** We ask that you keep the issue private until a fix is available. We will credit you in the release notes if you want us to.

## Out of Scope

- Vulnerabilities in third-party dependencies. Please report those to the upstream project.
- Issues that require a deliberately misconfigured local development environment.

## Notes for this repository

- The app is a public client. Anything bundled into it can be extracted, so a report that the app bundle contains `INTERNAL_API_KEY`, a token, or any other secret is in scope.
- Tokens must live only in `expo-secure-store`. Tokens in logs, `AsyncStorage`, or deep links are in scope.
- The gateway in `gateway/` is in scope: path allowlist bypasses, rate limit bypasses, and socket relay issues.
