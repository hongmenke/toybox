# mybatis-sql-formatter Specification

## Purpose
TBD - created by archiving change add-toybox-hub-and-initial-tools. Update Purpose after archive.
## Requirements
### Requirement: MyBatis command is registered
The extension MUST register a `mybatis` command in `package.json` with `mode: "view"` so the tool can be invoked directly from the Raycast command palette.

#### Scenario: MyBatis command is discoverable
- **WHEN** a developer opens Raycast and types "Format MyBatis SQL"
- **THEN** the `mybatis` command appears in the result list

### Requirement: Clipboard auto-detection on mount
On mount the command MUST call `Clipboard.readText()`. If the returned text contains at least one line beginning with `Preparing:` the command MUST parse it and push the result view.

#### Scenario: Clipboard contains a MyBatis log snippet
- **WHEN** the clipboard contains a line beginning with `Preparing:` at the time the command opens
- **THEN** the command parses the snippet and navigates straight to a `Detail` view that renders the runnable SQL

#### Scenario: Clipboard is empty or has no Preparing line
- **WHEN** the clipboard is empty or has no `Preparing:` line
- **THEN** the command renders a `Form` so the user can paste the log manually

### Requirement: MyBatis log parsing
The parser MUST locate the first line matching `Preparing:\s*` and the first line matching `Parameters:\s*`. It MUST substitute every `?` placeholder in the SQL template with the corresponding parameter, in order.

#### Scenario: Every placeholder is replaced
- **WHEN** the SQL template has `N` placeholders and the `Parameters:` line has `N` values
- **THEN** the formatted SQL contains `N` substituted values and no `?` characters

#### Scenario: Extra Total line is ignored
- **WHEN** the input contains a `<==      Total: X` line in addition to `Preparing` / `Parameters`
- **THEN** the parser ignores that line and produces the same SQL as without it

#### Scenario: Escaped newlines in SQL are normalised
- **WHEN** the SQL template contains literal `\n` / `\t` / `\r` escape sequences
- **THEN** the formatted SQL replaces them with the corresponding whitespace characters

### Requirement: Parameter value formatting
The formatter MUST render each parameter according to its MyBatis type:
- `null` values become the literal `NULL`.
- Numeric types (`Integer`, `Long`, `Short`, `Byte`, `Float`, `Double`, `BigDecimal`, `BigInteger`, `Number` and primitive variants) are emitted raw.
- `Boolean` (and primitive variants) become `TRUE` / `FALSE`.
- All other types (including `String`, `Date`, `Timestamp`) are wrapped in single quotes with single quotes inside the value doubled.

#### Scenario: Numeric parameter is emitted raw
- **WHEN** a parameter has type `Integer` and value `42`
- **THEN** the formatted SQL contains `42` (no quotes)

#### Scenario: String parameter is quoted and escaped
- **WHEN** a parameter has type `String` and value `O'Brien`
- **THEN** the formatted SQL contains `'O''Brien'`

#### Scenario: Null parameter becomes NULL
- **WHEN** a parameter has type `null` or value `null`
- **THEN** the formatted SQL contains the literal `NULL`

### Requirement: Result view provides copy actions
The result view MUST expose:
- A primary action that copies the formatted SQL to the clipboard.
- A secondary action that copies the original log snippet to the clipboard.
- An optional "copy as INSERT" action that, for `SELECT … FROM <table>` statements, produces a best-effort `INSERT INTO <table> (cols) VALUES (?, ?, …)` template.

#### Scenario: Formatted SQL can be copied
- **WHEN** the user triggers the primary action on the result view
- **THEN** the clipboard contains the runnable SQL exactly as displayed

#### Scenario: Original log can be copied
- **WHEN** the user triggers the "copy original" action on the result view
- **THEN** the clipboard contains the original log snippet exactly as the user submitted it

### Requirement: Result view exposes parameter metadata
The result view MUST list each parsed parameter (type + preview of the raw value) in the metadata sidebar so the user can audit the substitutions.

#### Scenario: Metadata lists each parameter
- **WHEN** the formatted SQL is rendered
- **THEN** the metadata sidebar contains one entry per parameter showing its type and the raw value

