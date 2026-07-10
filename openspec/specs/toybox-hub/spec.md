# toybox-hub Specification

## Purpose
TBD - created by archiving change add-toybox-hub-and-initial-tools. Update Purpose after archive.
## Requirements
### Requirement: Hub command is registered
The extension MUST register a `toybox` command in `package.json` with `mode: "view"` so Raycast can discover it as a root command.

#### Scenario: Hub command is discoverable
- **WHEN** a developer opens Raycast and types "ToyBox"
- **THEN** the `toybox` command appears in the result list

### Requirement: Hub lists every registered tool
The hub MUST render one `List.Item` for every entry in `src/tools.ts`. Each item MUST display the tool's title, description, and icon.

#### Scenario: All tools are listed
- **WHEN** the user opens the `toybox` command
- **THEN** every tool currently in the registry is shown in the list

#### Scenario: Search filters the list
- **WHEN** the user types text into the hub search bar
- **THEN** Raycast filters the list using the title, subtitle, and `keywords` of each `List.Item`

### Requirement: Selecting a tool launches its sub-command
Selecting a tool item MUST launch the matching sub-command via `launchCommand` with `LaunchType.UserInitiated`. The hub MUST NOT remain in the navigation stack once the sub-command takes over.

#### Scenario: Tool launches as a root command
- **WHEN** the user selects a tool item and presses Enter
- **THEN** Raycast invokes the sub-command registered for that tool's `name`

### Requirement: Adding a new tool is a one-file change
A new tool MUST be addable by appending a single entry to the `tools` array in `src/tools.ts`. No other source file MUST require modification to expose the tool in the hub.

#### Scenario: New tool appears in the hub
- **WHEN** a developer adds a new entry to `src/tools.ts` and registers a matching command in `package.json`
- **THEN** the new tool appears in the hub list and is searchable by its `keywords`

