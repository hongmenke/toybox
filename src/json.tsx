/**
 * JSON 查看器命令。
 *
 * 启动后直接渲染 {@link JsonInputForm}，让用户粘贴或输入 JSON 文本；
 * 提交时解析，成功则推送到树的根页面（{@link JsonNodePage}），失败则
 * 推送到错误页面（{@link JsonErrorPage}），不再做剪贴板自动识别。
 */

import { Action, ActionPanel, Detail, Form, useNavigation } from "@raycast/api";

import { JsonNodePage } from "./components/JsonNodePage";
import { buildNode, parseJson } from "./json-viewer/jsonParser";

/** `Form.TextArea` 默认值；空字符串表示无预填。 */
const EMPTY_FORM_VALUE = "";

/**
 * 命令入口：渲染表单，等待用户提交。
 *
 * 整个命令没有挂载副作用（不再读剪贴板），因此没有 useEffect / loading 状态。
 */
export default function Command() {
  const navigation = useNavigation();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="View JSON"
            onSubmit={(values) => {
              const text = (values.content ?? "").toString();
              const result = parseJson(text);
              if (result.kind === "error") {
                navigation.push(<JsonErrorPage message={result.message} original={text} />);
                return;
              }
              const root = buildNode(result.value, {
                key: "root",
                indexKey: "root",
                parentPath: "$",
                parentType: "root",
              });
              navigation.push(<JsonNodePage node={root} root={root} />);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="content"
        title="JSON 内容"
        placeholder='{\n  "hello": "world"\n}'
        defaultValue={EMPTY_FORM_VALUE}
        enableMarkdown={false}
      />
      <Form.Description
        title="提示"
        text="粘贴或输入任意 JSON 文本，提交后进入树形浏览页。支持对象 / 数组懒加载下钻与 Primitive 详情查看。"
      />
    </Form>
  );
}

/** `JsonErrorPage` 的 props。 */
interface JsonErrorPageProps {
  /** `JSON.parse` 抛出的错误消息。 */
  readonly message: string;
  /** 用户最初提交的原始文本（可能为空）。 */
  readonly original: string;
}

/**
 * 解析失败页：以 `Detail` 视图展示错误信息与原始输入，并提供
 * "返回编辑" Action 回到输入表单。
 */
function JsonErrorPage({ message, original }: JsonErrorPageProps) {
  const navigation = useNavigation();
  const trimmed = original.trim();
  const body = trimmed ? (trimmed.length > 4000 ? `${trimmed.slice(0, 4000)}\n…（已截断）` : trimmed) : "（空）";
  const markdown = `## 解析失败\n\n\`\`\`text\n${message}\n\`\`\`\n\n### 原始输入\n\n\`\`\`text\n${body}\n\`\`\``;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action
            title="返回编辑"
            onAction={() => {
              navigation.pop();
            }}
          />
        </ActionPanel>
      }
    />
  );
}
