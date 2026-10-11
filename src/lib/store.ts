import { getCloudflareContext } from "@opennextjs/cloudflare";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentSettings, KnowledgeDocument } from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const defaults: AgentSettings = { instructions: "", model: "gemini-3.8-flash" };

function getKv() {
  try {
    const ctx = getCloudflareContext();
    return (ctx.env as { KNOWLEDGE_STORE?: KVNamespace })?.KNOWLEDGE_STORE;
  } catch {
    return undefined;
  }
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const kv = getKv();
  if (kv) {
    const data = await kv.get(key, "json");
    return (data as T) ?? fallback;
  }

  // Local fallback (node:fs)
  try {
    const contents = await readFile(path.join(dataDirectory, `${key}.json`), "utf8");
    return JSON.parse(contents) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown) {
  const kv = getKv();
  if (kv) {
    await kv.put(key, JSON.stringify(value));
    return;
  }

  // Local fallback (node:fs)
  await mkdir(dataDirectory, { recursive: true });
  const target = path.join(dataDirectory, `${key}.json`);
  const temporary = `${target}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2), "utf8");
  await rename(temporary, target);
}

export function getDocuments() {
  return readJson<KnowledgeDocument[]>("documents", []);
}

export function saveDocuments(documents: KnowledgeDocument[]) {
  return writeJson("documents", documents);
}

export function getSettings() {
  return readJson<AgentSettings>("settings", defaults);
}

export function saveSettings(settings: AgentSettings) {
  return writeJson("settings", settings);
}