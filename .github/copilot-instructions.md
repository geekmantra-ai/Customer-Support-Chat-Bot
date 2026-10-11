# Workspace Instructions

- Keep the Gemini API key server-side in `.env.local`; never expose it to client code.
- Company documents and agent settings are persisted as local JSON under `data/` for this single-instance MVP.
- Preserve retrieval grounding and source citations in chat responses. When no relevant source is found, do not ask Gemini to guess.
- Validate PDF, text, and Markdown uploads and keep file-size limits enforced by the API.
- Run `npm run lint` and `npx tsc --noEmit` after changing application code.