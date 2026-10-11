export type KnowledgeDocument = {
  id: string;
  name: string;
  type: "application/pdf" | "text/plain" | "text/markdown";
  bytes: number;
  createdAt: string;
  chunks: string[];
};

export type AgentSettings = {
  instructions: string;
  model: string;
};

export type PublicDocument = Omit<KnowledgeDocument, "chunks"> & {
  chunkCount: number;
};