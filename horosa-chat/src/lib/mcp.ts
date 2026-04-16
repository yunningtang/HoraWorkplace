export interface McpToolCallResult {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: { code: string; message: string };
  [key: string]: unknown;
}

export async function callTool(
  name: string,
  args: Record<string, unknown>
): Promise<McpToolCallResult> {
  const resp = await fetch("/api/mcp/call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, args }),
  });
  if (!resp.ok) {
    throw new Error(`MCP bridge error: ${resp.status}`);
  }
  return resp.json();
}

export async function listTools(): Promise<{ name: string; description: string }[]> {
  const resp = await fetch("/api/mcp/tools");
  if (!resp.ok) throw new Error(`MCP bridge error: ${resp.status}`);
  return resp.json();
}
