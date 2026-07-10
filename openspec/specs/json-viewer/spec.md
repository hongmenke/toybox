# json-viewer Specification

## Purpose
TBD - created by archiving change add-toybox-hub-and-initial-tools. Update Purpose after archive.
## Requirements
### Requirement: JSON command is registered
The extension MUST register a `json` command in `package.json` with `mode: "view"` so the tool can be invoked directly from the Raycast command palette.

#### Scenario: JSON command is discoverable
- **WHEN** a developer opens Raycast and types "Format JSON"
- **THEN** the `json` command appears in the result list

### Requirement: Clipboard auto-detection on mount
On mount the command MUST call `Clipboard.readText()`. If the returned text parses as JSON the command MUST immediately push a result view showing the pretty-printed output without further user interaction.

#### Scenario: Valid JSON in clipboard
- **WHEN** the clipboard contains a syntactically valid JSON value at the time the command opens
- **THEN** the command navigates straight to a `Detail` view that renders the value formatted with 2-space indentation inside a `json` fenced code block

#### Scenario: Empty or invalid clipboard
- **WHEN** the clipboard is empty or contains a string that does not parse as JSON
- **THEN** the command renders a `Form` with a `TextArea` so the user can paste or type JSON manually

### Requirement: Manual entry via Form
The Form MUST submit through `Action.SubmitForm`. On submit it MUST re-validate the input and, on success, push to the same result view used for clipboard auto-detection. On failure it MUST display a `Toast.Failure` containing the underlying parse error.

#### Scenario: Manual JSON succeeds
- **WHEN** the user types JSON into the Form and presses Enter
- **THEN** the command navigates to the result view showing the pretty-printed JSON

#### Scenario: Manual JSON fails to parse
- **WHEN** the user submits a Form value that is not valid JSON
- **THEN** a failure toast appears and the Form remains visible

### Requirement: Result view provides copy actions
The result view MUST expose:
- A primary action that copies the formatted JSON to the clipboard.
- A secondary action that copies the original (un-formatted) input to the clipboard.

#### Scenario: Formatted JSON can be copied
- **WHEN** the user triggers the primary action on the result view
- **THEN** the clipboard contains the pretty-printed JSON

#### Scenario: Raw input can be copied
- **WHEN** the user triggers the secondary "copy raw" action on the result view
- **THEN** the clipboard contains the original text exactly as the user submitted it

### Requirement: Result view exposes metadata
The result view MUST display, in the metadata sidebar, the JSON value's high-level type (object / array / primitive), character count, and byte size of both the formatted and original inputs.

#### Scenario: Metadata reflects the value
- **WHEN** the result view is rendered
- **THEN** the metadata sidebar lists the type, length, and size of the formatted JSON plus the same metrics for the original input

