import pdfParse from "pdf-parse/lib/pdf-parse.js";
import type { KnowledgeDocument } from "@/lib/types";

export const maxUploadBytes = 12 * 1024 * 1024;
const chunkSize = 1100;
const chunkOverlap = 140;
const stopWords = new Set(["about", "after", "again", "also", "and", "are", "can", "does", "for", "from", "have", "how", "into", "its", "our", "that", "the", "their", "them", "then", "there", "these", "this", "what", "when", "where", "which", "with", "would", "your"]);

export async function extractText(file: File) {
  const extension = file.name.toLowerCase().split(".").pop();
  const data = Buffer.from(await file.arrayBuffer());
  if (extension === "pdf") {
    const parsed = await pdfParse(data);
    return parsed.text;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(data);
}

export function chunkText(text: string) {
  const normalized = text.replace(/\r\n?/g, "\n").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);
    if (end < normalized.length) {
      const boundary = Math.max(normalized.lastIndexOf("\n", end), normalized.lastIndexOf(" ", end));
      if (boundary > start + chunkSize * 0.55) end = boundary;
    }
    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= normalized.length) break;
    start = Math.max(end - chunkOverlap, start + 1);
  }
  return chunks;
}

export function findRelevantChunks(query: string, documents: KnowledgeDocument[]) {
  const terms = [...new Set((query.toLowerCase().match(/[a-z0-9]{2,}/g) ?? []).filter((term) => !stopWords.has(term)))].slice(0, 12);
  if (!terms.length) return [];

  const ranked = documents.flatMap((document) => document.chunks.map((text, index) => {
    const lower = text.toLowerCase();
    const matches = terms.reduce((count, term) => count + (lower.includes(term) ? 1 : 0), 0);
    const phraseBonus = lower.includes(query.toLowerCase()) ? 0.4 : 0;
    const score = matches / Math.min(terms.length, 8) + phraseBonus;
    return { document, index, text, score };
  }));

  return ranked
    .filter((item) => item.score >= 0.12)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
}

export function publicDocument(document: KnowledgeDocument) {
  const { chunks, ...summary } = document;
  return { ...summary, chunkCount: chunks.length };
}