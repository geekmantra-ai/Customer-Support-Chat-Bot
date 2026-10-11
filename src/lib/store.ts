import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentSettings, KnowledgeDocument } from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const defaults: AgentSettings = { instructions: "", model: "gemini-3.8-flash" };

async function readJson<T>(fileName: string, fallback: T): Promise<T> {
  try {
    const contents = await readFile(path.join(dataDirectory, fileName), "utf8");
    return JSON.parse(contents) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(fileName: string, value: unknown) {
  await mkdir(dataDirectory, { recursive: true });
  const target = path.join(dataDirectory, fileName);
  const temporary = `${target}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2), "utf8");
  await rename(temporary, target);
}

export function getDocuments() {
  return readJson<KnowledgeDocument[]>("documents.json", []);
}

export function saveDocuments(documents: KnowledgeDocument[]) {
  return writeJson("documents.json", documents);
}

export function getSettings() {
  return readJson<AgentSettings>("settings.json", defaults);
}

export function saveSettings(settings: AgentSettings) {
  return writeJson("settings.json", settings);
}