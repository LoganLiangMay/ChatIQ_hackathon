import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client
 * Uses singleton pattern to reuse connection across Lambda invocations
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Generate embeddings for text
 * Uses text-embedding-3-small for cost efficiency
 * 
 * @param text - Text to embed
 * @returns Embedding vector (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();
  
  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 * More efficient than individual calls
 * 
 * @param texts - Array of texts to embed (max 100 per batch)
 * @returns Array of embedding vectors
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const client = getOpenAIClient();
  
  // OpenAI supports up to 2048 inputs, but we'll be conservative
  if (texts.length > 100) {
    throw new Error('Batch size too large. Max 100 texts per batch.');
  }

  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    });

    return response.data.map(item => item.embedding);
  } catch (error: any) {
    console.error('Error generating embeddings batch:', error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

/**
 * Call OpenAI Chat Completion API
 * 
 * @param messages - Array of chat messages
 * @param options - Optional parameters
 * @returns Chat completion response
 */
export async function callChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const client = getOpenAIClient();

  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 1000,
  } = options;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: messages as any,
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0].message.content || '';
  } catch (error: any) {
    console.error('Error calling chat completion:', error);
    throw new Error(`Chat completion failed: ${error.message}`);
  }
}


