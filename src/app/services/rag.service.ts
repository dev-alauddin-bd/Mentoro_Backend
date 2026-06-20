import { OpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

// Simple on‑disk FAISS store – suitable for development and small knowledge bases.
export const getVectorStore = async () => {
  const embeddings = new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY });
  // "rag_index" will be created on first run if it does not exist.
  const store = await (FaissStore as any).fromExistingIndex("rag_index", embeddings);
  return store;
};

export const searchKnowledgeBase = async (query: string) => {
  const store = await getVectorStore();
  const docs = await store.similaritySearch(query, 5);
  // Return minimal JSON for the LLM to consume.
  return JSON.stringify(
    docs.map((d) => ({ pageContent: d.pageContent, metadata: d.metadata }))
  );
};
