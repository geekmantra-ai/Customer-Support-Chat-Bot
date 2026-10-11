# Mantra Bot

A local-first chat workspace for configuring Mantra Bot, adding company information, and asking Gemini questions.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` to your Google AI Studio API key. Keep the key private; it is only read by server routes.
3. Start the app with `npm run dev` and open the local URL shown in the terminal.
4. Open **Knowledge** to add system instructions and upload company documents. Then return to **Ask the agent**.

The model defaults to `gemini-3.8-flash`. You can enter another Gemini model ID in Knowledge. The API key is never sent to the browser. Built-in instructions define Mantra Bot's role and privacy behavior; administrator instructions are appended to those defaults.

## How grounding works

PDF text is extracted with `pdf-parse`; TXT and Markdown are decoded as UTF-8. Text is split into overlapping excerpts and stored in a local keyword index. Each chat request retrieves up to five matching excerpts and sends only those excerpts, the recent conversation, and the saved instructions to Gemini. The assistant never names or cites reference files or explains its internal process. It can answer general questions from general knowledge; when a specific GeekMantra AI fact is not confirmed, it avoids inventing one and gives a brief, customer-friendly response.

This lightweight retrieval strategy is suitable for a local MVP and small knowledge sets. It is lexical rather than embedding-based semantic search. Scanned/image-only PDFs need OCR before upload.

## Local data and limits

- Documents and instructions are stored as JSON under `data/`, which is ignored by Git.
- Uploads are limited to PDF, TXT, and Markdown, with a 12 MB maximum per file.
- Gemini API usage may incur charges or be subject to Google AI Studio rate limits.
- This is a single-instance local prototype. Before deploying for a team, add authentication, authorization, a shared persistent database/object store, upload malware scanning, and deployment-appropriate rate limits. Do not expose it publicly as-is.

## Checks

Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` to validate the project.