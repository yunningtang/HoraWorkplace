import http from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline";

const PORT = 8901;
const UV_DIR = "d:/Code/horosa-skill/horosa-skill";

let child = null;
let rl = null;
const pending = new Map();
let nextId = 1;

function ensureChild() {
  if (child && !child.killed) return;

  const isWin = process.platform === "win32";
  const cmd = isWin ? "uv.exe" : "uv";
  child = spawn(cmd, [
    "--directory", UV_DIR,
    "run", "horosa-skill", "serve", "--transport", "stdio",
  ], {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });

  child.stderr.on("data", (d) => process.stderr.write(`[horosa] ${d}`));
  child.on("exit", (code) => {
    console.log(`[horosa] exited with code ${code}`);
    child = null;
  });

  rl = createInterface({ input: child.stdout });
  rl.on("line", (line) => {
    try {
      const msg = JSON.parse(line);
      if (msg.id != null && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    } catch {}
  });

  // Send initialize
  const initId = nextId++;
  const initReq = JSON.stringify({
    jsonrpc: "2.0",
    id: initId,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "horosa-chat-bridge", version: "0.1.0" },
    },
  });
  child.stdin.write(initReq + "\n");
}

function sendRpc(method, params) {
  ensureChild();
  const id = nextId++;
  const req = JSON.stringify({ jsonrpc: "2.0", id, method, params });
  return new Promise((resolve, reject) => {
    pending.set(id, resolve);
    child.stdin.write(req + "\n");
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error("MCP call timeout"));
      }
    }, 120_000);
  });
}

async function handleToolCall(name, args) {
  const resp = await sendRpc("tools/call", { name, arguments: args });
  if (resp.error) {
    return { ok: false, error: resp.error };
  }
  const content = resp.result?.content;
  if (content?.[0]?.type === "text") {
    try {
      return JSON.parse(content[0].text);
    } catch {
      return { ok: true, raw: content[0].text };
    }
  }
  return { ok: true, result: resp.result };
}

async function handleListTools() {
  const resp = await sendRpc("tools/list", {});
  if (resp.error) return [];
  return (resp.result?.tools ?? []).map((t) => ({
    name: t.name,
    description: t.description,
  }));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.url === "/api/mcp/tools" && req.method === "GET") {
      const tools = await handleListTools();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(tools));
    } else if (req.url === "/api/mcp/call" && req.method === "POST") {
      const body = JSON.parse(await readBody(req));
      const result = await handleToolCall(body.name, body.args);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } else {
      res.writeHead(404);
      res.end("not found");
    }
  } catch (e) {
    console.error(e);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: { message: e.message } }));
  }
});

server.listen(PORT, () => {
  console.log(`MCP bridge listening on http://localhost:${PORT}`);
  ensureChild();
});
