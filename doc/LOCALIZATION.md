# Paperclip CN Localization

## Scope

Paperclip CN keeps the official application code and the Chinese language layer
separate. The supported Paperclip CN 1.0 locales are:

- `en` — English fallback and reference locale
- `zh-CN` — Simplified Chinese

Other locale files remain in the repository for upstream compatibility, but they
are not part of the Paperclip CN 1.0 acceptance promise until they have complete
messages and a dedicated review.

## Runtime behavior

- The browser keeps a fast local copy in `paperclip.locale`.
- After sign-in, the same preference is persisted in the server database as the
  user's workspace preference and is returned in the auth session. This is the
  durable source that restores the language after a Paperclip process restart,
  browser reload, or a new browser context on the same instance.
- When no preference exists, a browser language beginning with `zh` selects
  `zh-CN`; all other languages select `en`.
- Unsupported or unreadable preferences fall back to `en`.
- Missing Chinese messages fall back to English through i18next.
- Language switching does not change authentication, server state, or query
  data.

The database must itself be persistent. For local embedded storage, keep
`~/.paperclip/instances/default/db/`. For Docker, persist the `/paperclip`
volume. Recreating a container without its database volume cannot preserve any
user preference, including the language choice.

The language selector is available in the organization settings page, the
account menu, and the profile settings page. The organization settings entry is
the primary discoverable entry because it is the page users commonly open when
configuring a local Paperclip instance.

## Translation rules

- `ui/src/i18n/locales/en.json` is the reference key set.
- `ui/src/i18n/locales/zh-CN.json` must contain the same keys.
- Keep interpolation placeholders, URLs, commands, paths, keyboard shortcuts,
  Markdown structure, and code unchanged.
- Keep product names and model names such as Paperclip, Codex, OpenAI, and Agent
  consistent across the UI.
- Do not translate agent-generated content, provider names, command output, or
  source code in the UI locale layer.
- Prefer short action labels that fit existing controls.

## Checks

Run the dependency-free audit after changing locale files:

```bash
pnpm check:i18n
```

The UI locale test also validates all registered locale files against the English
reference and checks interpolation, links, and unsafe markup constraints:

```bash
pnpm exec vitest run ui/src/i18n/locale-validation.test.ts
```

## Upstream synchronization

1. Fetch `upstream` and create a synchronization branch.
2. Merge the official changes.
3. Resolve business-logic conflicts in favor of the official behavior.
4. Restore only the Paperclip CN localization layer where conflicts occur.
5. Run `pnpm check:i18n`, UI typecheck, build, and core browser acceptance.
6. Record the upstream SHA, self-owned SHA, conflict files, and evidence before
   merging into the self-owned branch.

Do not edit the installed npm package or compiled `ui-dist` as a permanent fix.
