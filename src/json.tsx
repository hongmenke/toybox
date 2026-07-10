import { Action, ActionPanel, Clipboard, Detail, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

/**
 * JSON Viewer command.
 *
 * Tries to use the clipboard content as JSON on mount; if that fails
 * (empty / invalid) it falls back to a Form where the user can paste or
 * type JSON manually. The successful path always ends up in {@link JsonResultView},
 * which renders the pretty-printed JSON in a Detail pane and exposes a
 * one-click copy action.
 */
export default function Command() {
  const navigation = useNavigation();
  const [clipboard, setClipboard] = useState<{ value: string | null; status: "loading" | "ready" }>({
    value: null,
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const text = await Clipboard.readText();
        if (!cancelled) {
          setClipboard({ value: text ?? null, status: "ready" });
        }
      } catch (error) {
        if (!cancelled) {
          setClipboard({ value: null, status: "ready" });
          await showToast({
            style: Toast.Style.Failure,
            title: "Could not read clipboard",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (clipboard.status !== "ready") {
      return;
    }
    const trimmed = (clipboard.value ?? "").trim();
    if (!trimmed) {
      return;
    }
    const formatted = tryFormatJson(trimmed);
    if (formatted.kind === "ok") {
      // Clipboard already holds valid JSON – jump straight to the result view.
      navigation.push(<JsonResultView json={formatted.text} original={trimmed} />);
    }
  }, [clipboard, navigation]);

  if (clipboard.status === "loading") {
    return <Detail isLoading markdown="Reading clipboard…" />;
  }

  // Clipboard was empty or did not contain JSON – let the user enter it.
  const seed = (clipboard.value ?? "").trim() ? (clipboard.value ?? "") : "";
  return <JsonInputForm initialValue={seed} />;
}

/** Form used when clipboard auto-detection fails. */
function JsonInputForm({ initialValue }: { initialValue: string }) {
  const navigation = useNavigation();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Format JSON"
            icon={Icon.Checkmark}
            onSubmit={(values) => {
              const text = (values.content ?? "").trim();
              if (!text) {
                showToast({ style: Toast.Style.Failure, title: "Please paste some JSON first" });
                return;
              }
              const result = tryFormatJson(text);
              if (result.kind === "error") {
                showToast({
                  style: Toast.Style.Failure,
                  title: "Invalid JSON",
                  message: result.message,
                });
                return;
              }
              navigation.push(<JsonResultView json={result.text} original={text} />);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="content"
        title="JSON Content"
        placeholder='{\n  "hello": "world"\n}'
        defaultValue={initialValue}
        enableMarkdown={false}
      />
      <Form.Description
        title="Tip"
        text="Paste JSON, then press ⏎ (Enter) to format it. The pretty-printed result can be copied with ⌘C."
      />
    </Form>
  );
}

/** Result view: pretty-printed JSON + copy action. */
function JsonResultView({ json, original }: { json: string; original: string }) {
  const navigation = useNavigation();

  const metadata = useMemo(() => buildMetadata(json, original), [json, original]);

  return (
    <Detail
      markdown={`## JSON\n\n\`\`\`json\n${json}\n\`\`\``}
      metadata={metadata}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Formatted JSON"
            icon={Icon.Clipboard}
            content={json}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action.CopyToClipboard
            title="Copy Raw Input"
            icon={Icon.Text}
            content={original}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
          <Action
            title="Edit Input"
            icon={Icon.Pencil}
            shortcut={{ modifiers: ["cmd"], key: "e" }}
            onAction={() => navigation.pop()}
          />
        </ActionPanel>
      }
    />
  );
}

type FormatResult = { kind: "ok"; text: string } | { kind: "error"; message: string };

function tryFormatJson(text: string): FormatResult {
  try {
    const parsed: unknown = JSON.parse(text);
    return { kind: "ok", text: JSON.stringify(parsed, null, 2) };
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildMetadata(json: string, original: string) {
  const byteSize = new TextEncoder().encode(json).length;
  const originalSize = new TextEncoder().encode(original).length;
  let parsedKind = "Unknown";
  try {
    const value: unknown = JSON.parse(json);
    parsedKind = describeJson(value);
  } catch {
    parsedKind = "Invalid";
  }
  return (
    <Detail.Metadata>
      <Detail.Metadata.Label title="Type" text={parsedKind} icon={Icon.Code} />
      <Detail.Metadata.Label title="Length" text={`${json.length} chars`} />
      <Detail.Metadata.Label title="Size" text={`${formatBytes(byteSize)}`} />
      <Detail.Metadata.Separator />
      <Detail.Metadata.Label title="Original" text={`${original.length} chars`} />
      <Detail.Metadata.Label title="Original size" text={`${formatBytes(originalSize)}`} />
    </Detail.Metadata>
  );
}

function describeJson(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `Array (${value.length})`;
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    return `Object (${keys.length} keys)`;
  }
  return typeof value;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
