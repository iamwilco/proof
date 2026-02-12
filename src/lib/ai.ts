import prisma from "./prisma";

// Configuration for AI/LLM services
const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || "openai", // openai, anthropic, local
  apiKey: process.env.OPENAI_API_KEY || "",
  model: process.env.AI_MODEL || "gpt-4o-mini",
  embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || "2000", 10),
  temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
  
  // Rate limiting
  requestsPerMinute: parseInt(process.env.AI_RATE_LIMIT || "60", 10),
  maxCostPerDay: parseFloat(process.env.AI_MAX_COST_PER_DAY || "10"),
  
  // Vector database
  vectorDb: process.env.VECTOR_DB || "memory", // memory, pinecone, pgvector
  pineconeApiKey: process.env.PINECONE_API_KEY || "",
  pineconeIndex: process.env.PINECONE_INDEX || "proposals",
};

// In-memory rate limiting
const rateLimiter = {
  requests: [] as number[],
  dailyCost: 0,
  lastReset: Date.now(),
};

function checkRateLimit(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Clean old requests
  rateLimiter.requests = rateLimiter.requests.filter((t) => t > oneMinuteAgo);
  
  // Reset daily cost at midnight
  const today = new Date().setHours(0, 0, 0, 0);
  if (rateLimiter.lastReset < today) {
    rateLimiter.dailyCost = 0;
    rateLimiter.lastReset = now;
  }
  
  // Check limits
  if (rateLimiter.requests.length >= AI_CONFIG.requestsPerMinute) {
    return false;
  }
  
  if (rateLimiter.dailyCost >= AI_CONFIG.maxCostPerDay) {
    return false;
  }
  
  return true;
}

function recordRequest(cost: number): void {
  rateLimiter.requests.push(Date.now());
  rateLimiter.dailyCost += cost;
}

// Estimate cost based on token usage
function estimateCost(inputTokens: number, outputTokens: number): number {
  // Approximate costs for GPT-4o-mini (per 1M tokens)
  const inputCostPer1M = 0.15;
  const outputCostPer1M = 0.60;
  
  return (inputTokens * inputCostPer1M + outputTokens * outputCostPer1M) / 1000000;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface EmbeddingResponse {
  embedding: number[];
  tokens: number;
  cost: number;
}

// Chat completion
export async function chatCompletion(
  messages: ChatMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<ChatResponse> {
  if (!checkRateLimit()) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  if (!AI_CONFIG.apiKey) {
    // Return mock response when no API key is configured
    return mockChatCompletion(messages);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages,
        max_tokens: options?.maxTokens || AI_CONFIG.maxTokens,
        temperature: options?.temperature ?? AI_CONFIG.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const cost = estimateCost(inputTokens, outputTokens);

    recordRequest(cost);

    return {
      content: data.choices[0]?.message?.content || "",
      inputTokens,
      outputTokens,
      cost,
    };
  } catch (error) {
    console.error("Chat completion error:", error);
    throw error;
  }
}

// Mock chat completion for development/testing
function mockChatCompletion(messages: ChatMessage[]): ChatResponse {
  const lastMessage = messages[messages.length - 1];
  const mockContent = `[Mock AI Response] Processed: "${lastMessage?.content?.slice(0, 100)}..."`;
  
  return {
    content: mockContent,
    inputTokens: 100,
    outputTokens: 50,
    cost: 0,
  };
}

// Generate embeddings
export async function generateEmbedding(text: string): Promise<EmbeddingResponse> {
  if (!checkRateLimit()) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  if (!AI_CONFIG.apiKey) {
    // Return mock embedding when no API key is configured
    return mockEmbedding(text);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.embeddingModel,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    const tokens = data.usage?.total_tokens || 0;
    const cost = tokens * 0.02 / 1000000; // text-embedding-3-small cost

    recordRequest(cost);

    return {
      embedding: data.data[0]?.embedding || [],
      tokens,
      cost,
    };
  } catch (error) {
    console.error("Embedding generation error:", error);
    throw error;
  }
}

// Mock embedding for development/testing
function mockEmbedding(text: string): EmbeddingResponse {
  // Generate deterministic mock embedding based on text hash
  const hash = text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const embedding = Array(1536)
    .fill(0)
    .map((_, i) => Math.sin(hash + i) * 0.1);

  return {
    embedding,
    tokens: Math.ceil(text.length / 4),
    cost: 0,
  };
}

// In-memory vector store (for development)
const memoryVectorStore: Map<string, { id: string; embedding: number[]; metadata: Record<string, unknown> }> = new Map();

// Cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Store embedding in vector database
export async function storeEmbedding(
  id: string,
  embedding: number[],
  metadata: Record<string, unknown>
): Promise<void> {
  if (AI_CONFIG.vectorDb === "memory") {
    memoryVectorStore.set(id, { id, embedding, metadata });
    return;
  }

  // TODO: Implement Pinecone/pgvector storage
  throw new Error(`Vector database ${AI_CONFIG.vectorDb} not implemented`);
}

// Search similar embeddings
export async function searchSimilar(
  queryEmbedding: number[],
  topK: number = 10,
  filter?: Record<string, unknown>
): Promise<Array<{ id: string; score: number; metadata: Record<string, unknown> }>> {
  if (AI_CONFIG.vectorDb === "memory") {
    const results: Array<{ id: string; score: number; metadata: Record<string, unknown> }> = [];

    for (const [, item] of memoryVectorStore) {
      // Apply filter if provided
      if (filter) {
        let matches = true;
        for (const [key, value] of Object.entries(filter)) {
          if (item.metadata[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      const score = cosineSimilarity(queryEmbedding, item.embedding);
      results.push({ id: item.id, score, metadata: item.metadata });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  // TODO: Implement Pinecone/pgvector search
  throw new Error(`Vector database ${AI_CONFIG.vectorDb} not implemented`);
}

// Index a project's proposal text
export async function indexProject(projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      description: true,
      problem: true,
      solution: true,
      category: true,
      fundId: true,
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const text = [
    project.title,
    project.description,
    project.problem,
    project.solution,
  ]
    .filter(Boolean)
    .join("\n\n");

  const { embedding } = await generateEmbedding(text);

  await storeEmbedding(projectId, embedding, {
    type: "project",
    title: project.title,
    category: project.category,
    fundId: project.fundId,
  });
}

// Find similar projects
export async function findSimilarProjects(
  projectId: string,
  topK: number = 5
): Promise<Array<{ projectId: string; score: number; title: string }>> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      title: true,
      description: true,
      problem: true,
      solution: true,
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const text = [
    project.title,
    project.description,
    project.problem,
    project.solution,
  ]
    .filter(Boolean)
    .join("\n\n");

  const { embedding } = await generateEmbedding(text);
  const results = await searchSimilar(embedding, topK + 1, { type: "project" });

  // Filter out the query project itself
  const filtered = results
    .filter((r) => r.id !== projectId)
    .slice(0, topK);

  return filtered.map((r) => ({
    projectId: r.id,
    score: r.score,
    title: r.metadata.title as string,
  }));
}

// Get AI usage stats
export function getAIStats(): {
  requestsThisMinute: number;
  costToday: number;
  rateLimitRemaining: number;
  costLimitRemaining: number;
} {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const recentRequests = rateLimiter.requests.filter((t) => t > oneMinuteAgo).length;

  return {
    requestsThisMinute: recentRequests,
    costToday: rateLimiter.dailyCost,
    rateLimitRemaining: Math.max(0, AI_CONFIG.requestsPerMinute - recentRequests),
    costLimitRemaining: Math.max(0, AI_CONFIG.maxCostPerDay - rateLimiter.dailyCost),
  };
}
