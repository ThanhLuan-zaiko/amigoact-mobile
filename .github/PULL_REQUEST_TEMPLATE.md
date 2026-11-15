## Summary

What does this PR change, and why?

## Related issue

Closes #

## Changes

-

## Screenshots

For visual changes, add phone screenshots in light and dark mode, next to the matching web screen.

## How to test

1. Run `bun install`
2. Run `bun run start` and open the app in Expo Go or a development build
3. Steps specific to this change:

## Checklist

- [ ] `bun run lint` passes
- [ ] `bun run typecheck` passes
- [ ] `bun run test` passes
- [ ] `bunx expo export --platform android` builds
- [ ] Gateway checks pass (`bun run typecheck` and `bun test` in `gateway/`) if `gateway/` changed
- [ ] The screen matches its web counterpart, or the difference is recorded in `docs/web-parity.md`
- [ ] `package.json` and `bun.lock` are committed together if dependencies changed
- [ ] I have read the [Contributing guide](CONTRIBUTING.md)
