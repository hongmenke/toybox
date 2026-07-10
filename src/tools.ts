import { Icon } from "@raycast/api";

/**
 * Catalogue of every tool that ships with ToyBox.
 *
 * Each entry describes a sub-command that can either be invoked directly
 * from Raycast (it has its own `name` registered in package.json) or be
 * launched from the central hub via `launchCommand`.
 */
export type Tool = {
  /** Internal identifier – must match the command name in `package.json`. */
  name: string;
  /** Human readable title shown in the hub list. */
  title: string;
  /** Short description shown beneath the title and inside Raycast's command palette. */
  description: string;
  /** Keywords used for the dynamic search in the hub list. */
  keywords: string[];
  /** Emoji or Raycast icon used in the hub list. */
  icon: Icon;
};

export const tools: Tool[] = [
  {
    name: "json",
    title: "JSON Viewer",
    description: "Pretty-print JSON from the clipboard or paste it manually.",
    keywords: ["json", "format", "pretty", "viewer", "parse"],
    icon: Icon.Code,
  },
  {
    name: "mybatis",
    title: "MyBatis SQL Formatter",
    description: "Convert a MyBatis Preparing/Parameters log line into a runnable SQL statement.",
    keywords: ["mybatis", "sql", "log", "orm", "java", "format"],
    icon: Icon.Terminal,
  },
];
