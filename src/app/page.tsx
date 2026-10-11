"use client";

import {
  ArrowUp,
  Check,
  ChevronDown,
  FilePlus2,
  FileText,
  LibraryBig,
  LoaderCircle,
  MessageSquareText,
  MoreHorizontal,
  PanelLeftClose,
  Paperclip,
  Settings2,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type DocumentSummary = {
  id: string;
  name: string;
  type: string;
  bytes: number;
  createdAt: string;
  chunkCount: number;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Settings = {
  instructions: string;
  model: string;
  apiKeyConfigured: boolean;
};

const defaultSettings: Settings = {
  instructions: "",
  model: "gemini-3.8-flash",
  apiKeyConfigured: false,
};

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi, I’m Mantra Bot. How can I help you today?",
};

export default function Home() {
  const [view, setView] = useState<"chat" | "knowledge">("chat");
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.all([refreshDocuments(), refreshSettings()]).catch(() => {
      setNotice("Could not load the workspace. Refresh and try again.");
    });
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function refreshDocuments() {
    const response = await fetch("/api/documents");
    if (!response.ok) throw new Error("Unable to load documents");
    const data = (await response.json()) as { documents: DocumentSummary[] };
    setDocuments(data.documents);
  }

  async function refreshSettings() {
    const response = await fetch("/api/settings");
    if (!response.ok) throw new Error("Unable to load settings");
    const data = (await response.json()) as Settings;
    setSettings(data);
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setNotice("");

    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch("/api/documents", { method: "POST", body });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(result.error ?? `Could not add ${file.name}`);
      }
      await refreshDocuments();
      setNotice("Your files are ready to use in chat.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload failed.");
      await refreshDocuments();
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function removeDocument(document: DocumentSummary) {
    if (!window.confirm(`Remove ${document.name} from company knowledge?`)) return;
    const response = await fetch(`/api/documents?id=${encodeURIComponent(document.id)}`, {
      method: "DELETE",
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setNotice(result.error ?? "Could not remove this document.");
      return;
    }
    setDocuments((current) => current.filter((item) => item.id !== document.id));
    setNotice(`${document.name} removed.`);
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructions: settings.instructions,
          model: settings.model,
        }),
      });
      const result = (await response.json()) as Settings & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not save settings.");
      setSettings(result);
      setNotice("Agent settings saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>, prompt?: string) {
    event?.preventDefault();
    const question = (prompt ?? draft).trim();
    if (!question || busy) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };
    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setDraft("");
    setBusy(true);
    setNotice("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          history: messages
            .filter((message) => message.id !== "welcome")
            .slice(-8)
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      const result = (await response.json()) as {
        answer?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "The agent could not answer.");
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.answer ?? "I couldn't create an answer for that question.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: error instanceof Error ? error.message : "The agent could not answer.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const prompts = [
    "What should a new employee know?",
    "Summarize our company policies",
    "What do our documents say about customers?",
  ];

  return (
    <main className="workspace-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark"><Sparkles size={17} strokeWidth={2.2} /></div>
          <span className="brand-name">Mantra Bot</span>
          <button className="icon-button sidebar-collapse" aria-label="Collapse sidebar" title="Collapse sidebar">
            <PanelLeftClose size={17} />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">G</div>
          <div className="workspace-name"><strong>GeekMantra</strong><span>Company workspace</span></div>
          <ChevronDown size={15} className="muted-icon" />
        </div>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Workspace navigation">
          <button className={view === "chat" ? "nav-item active" : "nav-item"} onClick={() => setView("chat")}>
            <MessageSquareText size={17} /> <span>Ask the agent</span>
            <span className="nav-shortcut">⌘ 1</span>
          </button>
          <button className={view === "knowledge" ? "nav-item active" : "nav-item"} onClick={() => setView("knowledge")}>
            <LibraryBig size={17} /> <span>Knowledge</span>
            <span className="nav-count">{documents.length}</span>
          </button>
        </nav>

        <div className="sidebar-section-heading">
          <span>YOUR SOURCES</span>
          <button className="icon-button tiny" onClick={() => fileInput.current?.click()} aria-label="Add source" title="Add source">
            <FilePlus2 size={15} />
          </button>
        </div>
        <div className="source-list">
          {documents.length === 0 ? (
            <p className="sidebar-empty">Your company files will show up here.</p>
          ) : documents.slice(0, 6).map((document) => (
            <div className="source-row" key={document.id} title={document.name}>
              <FileText size={15} />
              <span>{document.name}</span>
              <button className="source-remove" onClick={() => void removeDocument(document)} aria-label={`Remove ${document.name}`} title="Remove source">
                <X size={13} />
              </button>
            </div>
          ))}
          {documents.length > 6 && <button className="show-all" onClick={() => setView("knowledge")}>View all {documents.length} sources</button>}
        </div>

        <div className="sidebar-bottom">
          <div className="connection-row">
            <span className={settings.apiKeyConfigured ? "connection-dot online" : "connection-dot"} />
            <span>{settings.apiKeyConfigured ? "Gemini connected" : "Gemini not configured"}</span>
            <MoreHorizontal size={17} className="muted-icon" />
          </div>
          <button className="profile-row" onClick={() => setView("knowledge")}>
            <span className="profile-avatar">GM</span>
            <span className="profile-copy"><strong>Workspace admin</strong><small>Agent settings</small></span>
            <Settings2 size={16} className="muted-icon" />
          </button>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs"><span>GeekMantra</span><span className="crumb-slash">/</span><strong>{view === "chat" ? "Ask the agent" : "Knowledge"}</strong></div>
          <div className="topbar-meta">
            <span className="model-indicator"><span className="model-dot" />{settings.model}</span>
            <button className="icon-button top-settings" onClick={() => setView("knowledge")} aria-label="Agent settings" title="Agent settings"><Settings2 size={17} /></button>
            <span className="top-avatar">GM</span>
          </div>
        </header>

        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button className="icon-button tiny" onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={14} /></button>
          </div>
        )}

        {view === "chat" ? (
          <div className="chat-layout">
            <div className="chat-heading">
              <div className="eyebrow"><span className="eyebrow-line" />MANTRA BOT</div>
              <h1>Good questions<br /><em>start here.</em></h1>
              <p>Ask about GeekMantra AI or get help with a general question.</p>
            </div>

            <div className="conversation" aria-live="polite">
              {messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  {message.role === "assistant" ? (
                    <div className="assistant-mark"><Sparkles size={15} /></div>
                  ) : <div className="user-mark">YOU</div>}
                  <div className="message-content">
                    <div className="message-meta">{message.role === "assistant" ? "MANTRA BOT" : "YOU"}<span>·</span>{message.id === "welcome" ? "READY WHEN YOU ARE" : "JUST NOW"}</div>
                    <p>{message.content}</p>
                  </div>
                </article>
              ))}
              {busy && <div className="thinking-row"><span className="thinking-mark"><Sparkles size={14} /></span><span>Putting together an answer</span><LoaderCircle size={15} className="spin" /></div>}
              <div ref={chatEnd} />
            </div>

            {messages.length === 1 && documents.length > 0 && (
              <div className="prompt-row">
                {prompts.map((prompt) => <button key={prompt} onClick={() => void sendMessage(undefined, prompt)}>{prompt}<ArrowUp size={13} /></button>)}
              </div>
            )}

            <div className="composer-wrap">
              <form className="composer" onSubmit={(event) => void sendMessage(event)}>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Ask something about your company..."
                  aria-label="Ask a question about your company"
                  rows={2}
                />
                <div className="composer-footer">
                  <div className="composer-tools">
                    <button type="button" className="icon-button attach-button" onClick={() => fileInput.current?.click()} aria-label="Add company files" title="Add company files"><Paperclip size={16} /></button>
                    <span>Mantra Bot · GeekMantra AI</span>
                  </div>
                  <button className="send-button" type="submit" disabled={busy || !draft.trim()} aria-label="Send message"><ArrowUp size={17} /></button>
                </div>
              </form>
              <div className="privacy-note"><span className="privacy-dot" />For best results, include details in your question.</div>
            </div>
          </div>
        ) : (
          <div className="knowledge-layout">
            <div className="knowledge-heading">
              <div className="eyebrow"><span className="eyebrow-line" />THE AGENT’S REFERENCE DESK</div>
              <h1>Knowledge<br /><em>and direction.</em></h1>
              <p>Give your agent the context and guardrails it needs.</p>
            </div>

            <form className="settings-form" onSubmit={(event) => void saveSettings(event)}>
              <section className="settings-section instruction-section">
                <div className="section-title-row">
                  <div><span className="section-index">01</span><h2>System instructions</h2></div>
                  <span className="section-kicker">AGENT BEHAVIOR</span>
                </div>
                <p className="section-description">Set a role, tone, and any rules your team wants the agent to follow.</p>
                <textarea
                  className="instructions-input"
                  value={settings.instructions}
                  onChange={(event) => setSettings((current) => ({ ...current, instructions: event.target.value }))}
                  placeholder="You are a helpful assistant for GeekMantra. Be clear, professional, and concise. Use company-specific terminology..."
                  rows={5}
                  maxLength={6000}
                />
                <div className="field-footer"><span>Your instructions are added to Mantra Bot’s default behavior.</span><span>{settings.instructions.length}/6000</span></div>
              </section>

              <section className="settings-section model-section">
                <div className="section-title-row">
                  <div><span className="section-index">02</span><h2>Language model</h2></div>
                  <span className="section-kicker">GOOGLE AI STUDIO</span>
                </div>
                <p className="section-description">Choose the Gemini model used to draft grounded answers.</p>
                <label className="model-select-label" htmlFor="model-name">Model ID</label>
                <div className="model-input-wrap"><Sparkles size={16} /><input id="model-name" value={settings.model} onChange={(event) => setSettings((current) => ({ ...current, model: event.target.value }))} maxLength={100} /><span>GEMINI</span></div>
                <p className="key-status"><span className={settings.apiKeyConfigured ? "connection-dot online" : "connection-dot"} />{settings.apiKeyConfigured ? "API key detected on the server" : "Add GEMINI_API_KEY to .env.local to connect"}</p>
              </section>

              <div className="save-row"><span>Changes apply to new conversations.</span><button type="submit" className="save-button" disabled={saving}>{saving ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}{saving ? "Saving" : "Save settings"}</button></div>
            </form>

            <section className="settings-section documents-section">
              <div className="section-title-row">
                <div><span className="section-index">03</span><h2>Company knowledge</h2><span className="document-count">{documents.length}</span></div>
                <button className="upload-button" onClick={() => fileInput.current?.click()} disabled={uploading}>{uploading ? <LoaderCircle size={15} className="spin" /> : <UploadCloud size={15} />}{uploading ? "Indexing files" : "Add documents"}</button>
              </div>
              <p className="section-description">PDF, TXT, and Markdown files. Up to 12 MB per document.</p>
              <div className={`drop-zone ${uploading ? "uploading" : ""}`} onClick={() => !uploading && fileInput.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void handleUpload(event.dataTransfer.files); }} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInput.current?.click(); }}>
                <div className="drop-icon"><UploadCloud size={21} /></div>
                <div><strong>{uploading ? "Reading and indexing your files..." : "Drop files here, or browse"}</strong><span>PDF · TXT · MD</span></div>
                {uploading && <LoaderCircle size={18} className="spin drop-spinner" />}
              </div>
              <div className="document-list">
                {documents.length === 0 ? <div className="documents-empty"><FileText size={18} /><span>No company sources yet</span></div> : documents.map((document) => (
                  <div className="document-item" key={document.id}>
                    <div className="document-icon"><FileText size={17} /></div>
                    <div className="document-info"><strong>{document.name}</strong><span>{formatBytes(document.bytes)} · {document.chunkCount} indexed excerpts · added {formatDate(document.createdAt)}</span></div>
                    <span className="indexed-state"><span />Indexed</span>
                    <button className="icon-button delete-document" onClick={() => void removeDocument(document)} aria-label={`Remove ${document.name}`} title="Remove document"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>

      <input ref={fileInput} className="visually-hidden" type="file" accept=".pdf,.txt,.md,.markdown,text/plain,text/markdown,application/pdf" multiple onChange={(event) => void handleUpload(event.target.files)} />
    </main>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}
