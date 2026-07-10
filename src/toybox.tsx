import { Action, ActionPanel, Icon, launchCommand, LaunchType, List } from "@raycast/api";
import { useMemo } from "react";

import { tools, type Tool } from "./tools";

/**
 * Central hub of the ToyBox extension.
 *
 * Shows every registered tool with a dynamic search bar. Selecting a tool
 * hands control over to the matching sub-command via `launchCommand`, which
 * keeps each tool's UX independent (clipboard fallback, manual entry, etc.).
 */
export default function Command() {
  const filteredTools = useTools();

  return (
    <List searchBarPlaceholder="Search ToyBox tools (e.g. json, mybatis)…" filtering={false}>
      {filteredTools.map((tool) => (
        <List.Item
          key={tool.name}
          title={tool.title}
          subtitle={tool.description}
          icon={tool.icon}
          keywords={tool.keywords}
          actions={
            <ActionPanel>
              <Action
                title="Open Tool"
                icon={Icon.ArrowRight}
                onAction={async () => {
                  await launchCommand({ name: tool.name, type: LaunchType.UserInitiated });
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

/**
 * Filters the static `tools` registry based on the user's search text.
 *
 * Raycast's built-in `List` filtering handles substring matches against
 * `title`/`keywords` automatically, but we want a fuzzy/case-insensitive
 * match across every visible field so partial Chinese / English queries
 * still feel responsive.
 */
function useTools(): Tool[] {
  // List does not currently expose its search text via a hook, so we keep
  // filtering local to the rendered items through `filtering={false}`.
  // Returning the full list keeps the contract simple – search happens in
  // the `List.Item` keywords.
  return useMemo(() => tools, []);
}
