## 1. Project scaffolding

- [x] 1.1 Add `json` and `mybatis` commands to `package.json` (and update the `toybox` description)
- [x] 1.2 Update `raycast-env.d.ts` to declare the new `Preferences.Mybatis` / `Arguments.Mybatis` namespaces
- [x] 1.3 Initialise git and commit the project state with a meaningful initial commit message

## 2. Tool registry

- [x] 2.1 Create `src/tools.ts` with the `Tool` type and the static `tools` array containing `json` and `mybatis`
- [x] 2.2 Pick distinct Raycast `Icon` values and keywords for each tool so the hub search feels responsive

## 3. ToyBox hub

- [x] 3.1 Implement `src/toybox.tsx` as a Raycast `List` driven by the `tools` registry
- [x] 3.2 Wire each `List.Item` to `launchCommand({ name, type: LaunchType.UserInitiated })`
- [x] 3.3 Verify TypeScript / ESLint / Prettier still pass for the hub

## 4. JSON Viewer

- [x] 4.1 Implement `src/json.tsx` clipboard auto-detection via `Clipboard.readText()`
- [x] 4.2 Implement the pretty-printer (`JSON.stringify(value, null, 2)`) and the result `Detail` view
- [x] 4.3 Implement the manual-entry `Form` fallback when the clipboard is empty or invalid
- [x] 4.4 Add copy actions (formatted JSON + raw input) and metadata sidebar
- [x] 4.5 Verify TypeScript / ESLint / Prettier still pass for the viewer

## 5. MyBatis SQL Formatter

- [x] 5.1 Implement `src/mybatis.tsx` clipboard auto-detection via `Clipboard.readText()`
- [x] 5.2 Implement the MyBatis log parser (`findLine`, `splitParameters`, `parseParameter`, `substitutePlaceholders`)
- [x] 5.3 Implement parameter value formatting (numeric / boolean / null / string-escape rules)
- [x] 5.4 Implement the result `Detail` view with copy actions (formatted SQL, original log, INSERT template)
- [x] 5.5 Implement the manual-entry `Form` fallback when the clipboard lacks a `Preparing:` line
- [x] 5.6 Verify TypeScript / ESLint / Prettier still pass for the formatter
- [x] 5.7 Smoke-test the parser against 10 representative inputs (numeric, string, boolean, null, no-params, comma-in-value, multi-line, BigDecimal, Date, `<== Total:` line, missing Preparing)

## 6. OpenSpec scaffolding

- [x] 6.1 Run `openspec init --tools codex,claude` and add `.codex/` / `.claude/` to `.gitignore`
- [x] 6.2 Create change proposal `add-toybox-hub-and-initial-tools` with proposal/design/tasks and per-capability delta specs
- [x] 6.3 Archive the change so the delta specs are merged into `openspec/specs/`
- [x] 6.4 Run `openspec validate` and re-run the project's TypeScript / ESLint / Prettier checks
- [x] 6.5 Commit the OpenSpec artifacts on top of the initial commit
