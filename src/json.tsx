import { Action, ActionPanel, Clipboard, Detail, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

/**
 * JSON 查看器命令。
 *
 * 启动时尝试把剪贴板内容当作 JSON 解析；失败时（为空或非法）回退到
 * Form 表单让用户手动粘贴或输入。成功路径最终都会进入
 * {@link JsonResultView}，在详情面板中渲染格式化后的 JSON 并提供
 * 一键复制操作。
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
            title: "无法读取剪贴板",
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
    return <Detail isLoading markdown="正在读取剪贴板…" />;
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
            title="格式化 JSON"
            icon={Icon.Checkmark}
            onSubmit={(values) => {
              const text = (values.content ?? "").trim();
              if (!text) {
                showToast({ style: Toast.Style.Failure, title: "请先粘贴 JSON 内容" });
                return;
              }
              const result = tryFormatJson(text);
              if (result.kind === "error") {
                showToast({
                  style: Toast.Style.Failure,
                  title: "JSON 格式不合法",
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
        title="JSON 内容"
        placeholder='{\n  "hello": "world"\n}'
        defaultValue={initialValue}
        enableMarkdown={false}
      />
      <Form.Description title="提示" text="粘贴 JSON 后按 ⏎（回车）即可格式化；美化后的结果可用 ⌘C 复制。" />
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
            title="复制格式化后的 JSON"
            icon={Icon.Clipboard}
            content={json}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action.CopyToClipboard
            title="复制原始输入"
            icon={Icon.Text}
            content={original}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
          <Action
            title="编辑输入"
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
      <Detail.Metadata.Label title="类型" text={parsedKind} icon={Icon.Code} />
      <Detail.Metadata.Label title="长度" text={`${json.length} 字符`} />
      <Detail.Metadata.Label title="体积" text={`${formatBytes(byteSize)}`} />
      <Detail.Metadata.Separator />
      <Detail.Metadata.Label title="原始长度" text={`${original.length} 字符`} />
      <Detail.Metadata.Label title="原始体积" text={`${formatBytes(originalSize)}`} />
    </Detail.Metadata>
  );
}

function describeJson(value: unknown): string {
  if (value === null) return "空值";
  if (Array.isArray(value)) return `数组（${value.length} 项）`;
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    return `对象（${keys.length} 个键）`;
  }
  return typeof value;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
