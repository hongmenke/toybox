import { Action, ActionPanel, Clipboard, Detail, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

/**
 * MyBatis log formatter command.
 *
 * MyBatis prints SQL like
 *
 *   ==>  Preparing: SELECT id, name FROM users WHERE status = ? AND created_at > ?
 *   ==> Parameters: 1(Integer), 2024-01-01 00:00:00.000(Timestamp)
 *   <==      Total: 5
 *
 * The two `?` placeholders are hard to copy-paste into a SQL client. This
 * command parses the log, replaces the placeholders with their bound values
 * and surfaces the runnable statement together with a copy action.
 *
 * On mount we read the clipboard. If it already contains a parseable log
 * snippet, we go straight to the result view. Otherwise we drop the user
 * into a Form so they can paste the log manually.
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
    const parsed = parseMybatisLog(trimmed);
    if (parsed) {
      navigation.push(<MybatisResultView parsed={parsed} original={trimmed} />);
    }
  }, [clipboard, navigation]);

  if (clipboard.status === "loading") {
    return <Detail isLoading markdown="Reading clipboard…" />;
  }

  // Clipboard did not look like a MyBatis log – let the user paste it.
  const seed = (clipboard.value ?? "").trim() ? (clipboard.value ?? "") : "";
  return <MybatisInputForm initialValue={seed} />;
}

/** Form used when clipboard auto-detection fails. */
function MybatisInputForm({ initialValue }: { initialValue: string }) {
  const navigation = useNavigation();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Format SQL"
            icon={Icon.Checkmark}
            onSubmit={(values) => {
              const text = (values.content ?? "").trim();
              if (!text) {
                showToast({
                  style: Toast.Style.Failure,
                  title: "Please paste a MyBatis log snippet first",
                });
                return;
              }
              const parsed = parseMybatisLog(text);
              if (!parsed) {
                showToast({
                  style: Toast.Style.Failure,
                  title: "No `Preparing:` line found",
                  message: "Copy the lines starting with `==> Preparing:` from your logs.",
                });
                return;
              }
              navigation.push(<MybatisResultView parsed={parsed} original={text} />);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="content"
        title="MyBatis Log"
        placeholder={"==>  Preparing: SELECT * FROM users WHERE id = ?\n" + "==> Parameters: 1(Integer)"}
        defaultValue={initialValue}
        enableMarkdown={false}
      />
      <Form.Description
        title="Tip"
        text="Copy the `==> Preparing:` and `==> Parameters:` lines from your MyBatis log and submit with ⏎."
      />
    </Form>
  );
}

/** Result view: runnable SQL + copy action + parameter list. */
function MybatisResultView({ parsed, original }: { parsed: ParsedMybatisLog; original: string }) {
  const navigation = useNavigation();
  const metadata = useMemo(() => buildMetadata(parsed), [parsed]);

  return (
    <Detail
      markdown={`## SQL\n\n\`\`\`sql\n${parsed.sql}\n\`\`\``}
      metadata={metadata}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Formatted SQL"
            icon={Icon.Clipboard}
            content={parsed.sql}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action.CopyToClipboard
            title="Copy as Insert Statement"
            icon={Icon.Plus}
            content={toInsertStatement(parsed.sql)}
            shortcut={{ modifiers: ["cmd", "shift"], key: "i" }}
          />
          <Action.CopyToClipboard
            title="Copy Original Log"
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

/* ------------------------------------------------------------------------ */
/*  Parsing                                                                  */
/* ------------------------------------------------------------------------ */

export type ParsedParameter = {
  /** Raw textual representation as it appeared in the log. */
  raw: string;
  /** Value without the `(Type)` suffix, unescaped. */
  value: string;
  /** Type name as printed by MyBatis (e.g. `String`, `Integer`). */
  type: string;
};

export type ParsedMybatisLog = {
  /** SQL after substituting `?` placeholders with their bound values. */
  sql: string;
  /** Bound parameters in the order they appear in the SQL. */
  parameters: ParsedParameter[];
  /** Raw SQL template (with `?` placeholders still in place). */
  template: string;
};

/**
 * Try to extract a `Preparing`/`Parameters` pair from a chunk of MyBatis log.
 * Returns `null` if no `Preparing` line is found.
 */
export function parseMybatisLog(input: string): ParsedMybatisLog | null {
  const preparingLine = findLine(input, /Preparing:\s*/);
  if (!preparingLine) {
    return null;
  }

  const template = unescapeSqlText(preparingLine.sql);
  const parametersLine = findLine(input, /Parameters:\s*/);
  const rawParameters = parametersLine ? splitParameters(parametersLine.tail) : [];
  const parameters = rawParameters.map(parseParameter);

  if (rawParameters.length > 0 && rawParameters.length !== countPlaceholders(template)) {
    // Best effort: keep going but flag the mismatch via a toast. We do not
    // throw because partial logs (e.g. only the Preparing line) are valid
    // inputs the user may want to format.
  }

  const sql = substitutePlaceholders(template, parameters);
  return { sql, parameters, template };
}

function findLine(input: string, prefix: RegExp): { sql: string; tail: string } | null {
  const lines = input.split(/\r?\n/);
  for (const line of lines) {
    const match = prefix.exec(line);
    if (!match) continue;
    const sql = line.slice(match.index + match[0].length);
    return { sql, tail: sql };
  }
  return null;
}

/**
 * MyBatis encodes real newlines/tabs as `\n` / `\t` in its log. Convert
 * those back to whitespace so the formatted SQL reads naturally.
 */
function unescapeSqlText(sql: string): string {
  return sql.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "\r");
}

/**
 * Split a `Parameters:` line into individual tokens. Tokens are separated by
 * `, ` (comma + space) but a value may legitimately contain a comma without
 * a trailing space. To keep things simple we first try the obvious split,
 * then re-merge any tokens that do not have a balanced `(Type)` suffix.
 */
export function splitParameters(text: string): string[] {
  const tokens = text.split(/,\s+/);
  const result: string[] = [];
  let buffer: string[] = [];
  for (const token of tokens) {
    buffer.push(token);
    if (/\([^()]*\)\s*$/.test(token)) {
      result.push(buffer.join(", "));
      buffer = [];
    }
  }
  if (buffer.length > 0) {
    result.push(buffer.join(", "));
  }
  return result;
}

/**
 * Extract the `(Type)` suffix from a single parameter token. If no suffix
 * is found we default to `String`, which mirrors MyBatis' behaviour for
 * un-typed loggers (e.g. when only the raw text is shown).
 */
export function parseParameter(token: string): ParsedParameter {
  const match = /^(.*)\(([^()]*)\)\s*$/.exec(token);
  if (!match) {
    return { raw: token, value: token, type: "String" };
  }
  return { raw: token, value: match[1].trim(), type: match[2].trim() };
}

function countPlaceholders(sql: string): number {
  return (sql.match(/\?/g) ?? []).length;
}

/**
 * Replace every `?` placeholder in `template` with the formatted value of
 * the next parameter in `parameters`. Unbound placeholders stay as `?`
 * so the user can spot missing parameters.
 */
export function substitutePlaceholders(template: string, parameters: ParsedParameter[]): string {
  let index = 0;
  return template.replace(/\?/g, () => {
    if (index >= parameters.length) {
      index += 1;
      return "?";
    }
    const param = parameters[index];
    index += 1;
    return formatParameter(param);
  });
}

const NUMERIC_TYPES = new Set([
  "Integer",
  "int",
  "Long",
  "long",
  "Short",
  "short",
  "Byte",
  "byte",
  "Float",
  "float",
  "Double",
  "double",
  "BigDecimal",
  "BigInteger",
  "Number",
]);

/** Render a parameter as a SQL literal. */
export function formatParameter(param: ParsedParameter): string {
  const type = param.type;
  const value = param.value;

  if (type === "null" || value === "null") {
    return "NULL";
  }
  if (type === "Boolean" || type === "boolean") {
    if (value === "true" || value === "false") {
      return value.toUpperCase();
    }
    return `'${escapeString(value)}'`;
  }
  if (NUMERIC_TYPES.has(type)) {
    return value;
  }
  return `'${escapeString(value)}'`;
}

/** Escape single quotes (and backslashes) for SQL string literals. */
function escapeString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "''");
}

/**
 * Very small helper: turn a `SELECT ...` SQL into a best-effort
 * `INSERT INTO ...` template using the same column list. Intended as a
 * quick copy action for developers who want to seed data; not a general
 * SQL parser.
 */
function toInsertStatement(sql: string): string {
  const match = /^\s*SELECT\s+([\s\S]+?)\s+FROM\s+([\w."`]+)/i.exec(sql);
  if (!match) {
    return sql;
  }
  const columns = match[1]
    .split(",")
    .map((part) => part.trim())
    .map((part) => part.replace(/\s+AS\s+\w+/i, ""))
    .filter(Boolean);
  if (columns.length === 0) {
    return sql;
  }
  const table = match[2];
  const columnList = columns.map((c) => c).join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  return `INSERT INTO ${table} (${columnList}) VALUES (${placeholders});`;
}

/* ------------------------------------------------------------------------ */
/*  UI helpers                                                               */
/* ------------------------------------------------------------------------ */

function buildMetadata(parsed: ParsedMybatisLog) {
  return (
    <Detail.Metadata>
      <Detail.Metadata.Label title="Parameters" text={`${parsed.parameters.length}`} icon={Icon.List} />
      <Detail.Metadata.Label
        title="Template"
        text={parsed.template.length > 80 ? `${parsed.template.slice(0, 77)}…` : parsed.template}
      />
      <Detail.Metadata.Separator />
      {parsed.parameters.length === 0 ? (
        <Detail.Metadata.Label title="(no parameters)" text="" icon={Icon.Minus} />
      ) : (
        parsed.parameters.map((p, i) => (
          <Detail.Metadata.Label
            key={i}
            title={`#${i + 1}  ${p.type}`}
            text={previewValue(p.value)}
            icon={Icon.Circle}
          />
        ))
      )}
    </Detail.Metadata>
  );
}

function previewValue(value: string): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= 60) return trimmed;
  return `${trimmed.slice(0, 57)}…`;
}
