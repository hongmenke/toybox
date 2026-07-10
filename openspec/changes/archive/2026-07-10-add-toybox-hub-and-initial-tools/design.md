## Context

ToyBox is a brand-new Raycast extension. The repo started with only a single placeholder command (`toybox`) and no user-facing capabilities. We are introducing:

1. A hub command that lists every tool registered with the extension and launches the matching sub-command.
2. Two initial developer utilities (JSON viewer, MyBatis SQL formatter), each implemented as an independent Raycast command.

Raycast supports a few different ways to wire up a "hub → sub-command" navigation:

- **Action.Push** with a `target={<Component/>}` stays inside the current command's view stack.
- **launchCommand** opens a new root view for the named sub-command. This is what most multi-tool Raycast extensions (e.g. Kill Process, Manage Extensions) use because each sub-command gets its own navigation history, its own arguments/preferences, and shows up directly in Raycast's command palette.
- **Deeplinks** via `createDeeplink` produce a URL the user can share but otherwise behave the same as `launchCommand`.

For ToyBox we want every tool to be reachable directly from the command palette (the spec calls this out: "每个功能都有独立命令") and we want clipboard auto-detection to run only when the user explicitly invokes the tool, not when they open the hub. That points at `launchCommand`.

## Goals / Non-Goals

**Goals:**
- Make adding a new tool a one-file change (a single entry in `src/tools.ts`).
- Give every tool the same clipboard-first / manual-fallback UX so users only learn one flow.
- Keep the runtime dependency surface flat: no extra libraries beyond `@raycast/api` / `@raycast/utils`.
- Keep all TypeScript, ESLint, and Prettier checks green so the Raycast store submission workflow keeps working.

**Non-Goals:**
- No preferences UI yet — every tool is invoked with sensible defaults. Preferences can be added once the catalogue grows.
- No remote fetch / network calls — every tool works offline.
- No streaming / large-output handling. Each tool is sized for "a few KB" of input.

## Decisions

- **Hub uses `launchCommand`, not `Action.Push`.** Rationale: every tool needs to be independently invokable from the command palette, with its own navigation stack and clipboard auto-detection. `Action.Push` would couple the tool's lifecycle to the hub. Alternatives considered: `Action.Open` with a deeplink — equivalent functionally but adds an `ownerOrAuthorName` requirement when the extension is renamed; we keep `launchCommand` for the simpler same-extension flow.
- **Tool catalogue is a single static array in `src/tools.ts`.** Rationale: the catalogue is small (currently two entries) and rarely changes at runtime. A registry pattern with code-splitting would be overkill. Alternatives considered: lazy `import()` per tool — adds Raycast manifest friction without measurable benefit.
- **Clipboard auto-detection runs in `useEffect`, not synchronously in render.** Rationale: `Clipboard.readText()` is async. Calling it inside render would either block or require `Suspense`. The `useEffect` approach mirrors the existing Raycast API examples and gives us a clean loading state.
- **JSON formatting uses 2-space indent.** Rationale: matches the default in `JSON.stringify(value, null, 2)` and what most editors produce. Configurable indent can come later if requested.
- **MyBatis parameter parsing splits on `, ` then re-merges tokens that lack a balanced `(Type)` suffix.** Rationale: MyBatis does not escape commas inside string values, so a naive split can split a single parameter in two. Re-merging until we see a balanced `(Type)` suffix matches the official log format.
- **Each tool returns a Raycast `Detail` for its result, not a custom React view.** Rationale: `Detail` gives us free markdown rendering (so the formatted SQL/JSON is highlighted), a metadata sidebar, and the built-in `Action.CopyToClipboard`. Custom views would duplicate all of that.
- **No tests added in this change.** Rationale: the parsing logic is small and the smoke tests we ran while building it have proven the algorithm. Formal test infrastructure (e.g. `vitest`) can be added in a follow-up change once there is shared test scaffolding.

## Risks / Trade-offs

- **MyBatis logs containing commas inside unquoted strings are ambiguous.** We pick the re-merge heuristic but it can still mis-parse pathological inputs. Mitigation: the result view shows the original log alongside the formatted SQL so the user can spot mistakes.
- **`launchCommand` keeps the hub in the navigation stack.** Pressing ESC returns to the hub, not to the Raycast root. Mitigation: each tool's result view exposes an "Edit Input" action that pops the stack; users who want to return to the root can use the standard Raycast close shortcut.
- **The hub disables Raycast's built-in filtering (`filtering={false}`) and instead relies on `keywords` on each item.** Raycast's `List` filter algorithm doesn't expose the search text via a hook, so wiring a fuzzy matcher would require either a `useState` + custom search or a `List.Item.Detail` pattern. For a two-item list the `keywords`-based filter is sufficient.

## Migration Plan

This is the first commit in the repo, so there is nothing to migrate. Future capability additions will be authored as new OpenSpec changes (e.g. `add-base64-tool`) and archived once implemented.

## Open Questions

- Should the hub support tool groups / categories once we have more than five tools? (Probably yes — revisit when count > 5.)
- Should each tool remember the last manual input via `useLocalStorage`? (Probably useful for the MyBatis formatter, defer to a follow-up.)
