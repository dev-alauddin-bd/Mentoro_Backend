import { OpenAIEmbeddings } from "@langchain/openai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { createClient } from "redis";
import md5 from "md5";
import { prisma } from "../../lib/prisma";

interface KnowledgeDocument {
  metadata: {
    docType: "course" | "lesson" | "faq" | "general";
    relevanceScore: number;
    lastUpdated: string;
    [key: string]: any;
  };
}

interface SearchOptions {
  k?: number;
  minScore?: number;
  filters?: {
    docType?: string[];
    updatedAfter?: string;
    [key: string]: any;
  };
}

// Cache setup
let redisClient: any;
const getRedisClient = async () => {
  if (!redisClient && process.env.REDIS_URL) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
  }
  return redisClient;
};

// Embedding provider selection (prefers Google if key is present to match getModel)
const getEmbeddings = () => {
  if (process.env.GOOGLE_API_KEY) {
    return new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "gemini-embedding-2", // Using gemini-embedding-001 since text-embedding-004 was retired in early 2026
    });
  }
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }
  throw new Error("No embedding API key found in environment variables (GOOGLE_API_KEY or OPENAI_API_KEY).");
};

// In-memory Cosine Similarity computation
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) {
    return 0; // Dimension mismatch
  }
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Enhanced RAG search with DB storage + In-Memory computation + Redis Cache
export const searchKnowledgeBase = async (
  query: string,
  options: SearchOptions = {}
) => {
  const { k = 10, minScore = 0.5, filters } = options;
  
  try {
    // 1. Check Redis cache first
    const redis = await getRedisClient();
    const cacheKey = `search:${md5(query + JSON.stringify(options))}`;
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    // 2. Generate Query Embedding
    const embeddings = getEmbeddings();
    const queryEmbedding = await embeddings.embedQuery(query);

    // 3. Fetch documents from Postgres database
    const whereClause: any = {};
    if (filters?.docType && filters.docType.length > 0) {
      whereClause.docType = { in: filters.docType };
    }
    if (filters?.updatedAfter) {
      whereClause.updatedAt = { gt: new Date(filters.updatedAfter) };
    }

    const docs = await prisma.knowledgeBase.findMany({
      where: whereClause,
      select: {
        id: true,
        content: true,
        docType: true,
        metadata: true,
        embedding: true,
      }
    });

    // 4. Calculate similarity scores and rank results
    const results = docs
      .map(doc => {
        const score = cosineSimilarity(queryEmbedding, doc.embedding);
        return {
          id: doc.id,
          content: doc.content,
          type: doc.docType,
          score,
          metadata: doc.metadata as any
        };
      })
      .filter(item => item.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    const response = {
      results,
      query,
      timestamp: new Date().toISOString()
    };

    // 5. Cache results in Redis (1hr TTL)
    if (redis) {
      await redis.setEx(cacheKey, 3600, JSON.stringify(response));
    }

    return response;
  } catch (error) {
    console.error("RAG search error:", error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Ingest documents and store embeddings in PostgreSQL database
export const ingestDocuments = async (
  documents: Array<{
    content: string;
    metadata: Omit<KnowledgeDocument["metadata"], "lastUpdated">;
  }>
) => {
  const embeddings = getEmbeddings();

  try {
    for (const doc of documents) {
      // Generate embedding for the document content
      const embedding = await embeddings.embedQuery(doc.content);

      const docMetadata = {
        ...doc.metadata,
        lastUpdated: new Date().toISOString()
      };

      const docId = doc.metadata.id || md5(doc.content);

      // Upsert document metadata & embedding vector into DB
      await prisma.knowledgeBase.upsert({
        where: { id: docId },
        update: {
          content: doc.content,
          docType: doc.metadata.docType,
          metadata: docMetadata,
          embedding: embedding,
        },
        create: {
          id: docId,
          content: doc.content,
          docType: doc.metadata.docType,
          metadata: docMetadata,
          embedding: embedding,
        }
      });
    }
  } catch (error) {
    console.error("RAG Ingestion Error:", error);
    throw new Error(`Ingestion failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
