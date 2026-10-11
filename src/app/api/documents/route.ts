import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { chunkText, extractText, maxUploadBytes, publicDocument } from "@/lib/knowledge";
import { getDocuments, saveDocuments } from "@/lib/store";

const allowedExtensions = new Set(["pdf", "txt", "md", "markdown"]);

export async function GET() {
  try {
    const documents = await getDocuments();
    return NextResponse.json({ documents: documents.map(publicDocument) });
  } catch {
    return NextResponse.json({ error: "Could not read the local document index." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF, TXT, or Markdown file." }, { status: 400 });

    const extension = file.name.toLowerCase().split(".").pop() ?? "";
    if (!allowedExtensions.has(extension)) return NextResponse.json({ error: "Only PDF, TXT, and Markdown files are supported." }, { status: 415 });
    if (!file.size || file.size > maxUploadBytes) return NextResponse.json({ error: "Each file must be between 1 byte and 12 MB." }, { status: 413 });

    const text = await extractText(file);
    const chunks = chunkText(text);
    if (!chunks.length) return NextResponse.json({ error: "No readable text was found in this file." }, { status: 422 });

    const mimeType = extension === "pdf" ? "application/pdf" : extension === "md" || extension === "markdown" ? "text/markdown" : "text/plain";
    const document = {
      id: randomUUID(),
      name: file.name.slice(0, 180),
      type: mimeType as "application/pdf" | "text/plain" | "text/markdown",
      bytes: file.size,
      createdAt: new Date().toISOString(),
      chunks,
    };
    const documents = await getDocuments();
    documents.push(document);
    await saveDocuments(documents);
    return NextResponse.json({ document: publicDocument(document) }, { status: 201 });
  } catch (error) {
    const message = error instanceof TypeError ? "This file could not be decoded as text." : "Could not process this document.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "A document ID is required." }, { status: 400 });

  try {
    const documents = await getDocuments();
    const remaining = documents.filter((document) => document.id !== id);
    if (remaining.length === documents.length) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    await saveDocuments(remaining);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update the local document index." }, { status: 500 });
  }
}