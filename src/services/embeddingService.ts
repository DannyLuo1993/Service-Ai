
import { AIParameters } from '@/components/ParameterControls';

const API_KEY = 'sk-kekjunkrrsvukzjwakjpgpzivkopchkvqvxorvrmpzuvhbtm';
const API_BASE_URL = 'https://api.siliconflow.cn/v1';

export interface EmbeddingResponse {
  id: string;
  object: string;
  data: {
    embedding: number[];
    index: number;
    object: string;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generates embeddings for the given text using the BGE-M3 model
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'Pro/BAAI/bge-m3',
        input: text
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate embedding');
    }

    const data: EmbeddingResponse = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};



/**
 * Simulates storing embeddings in a vector database
 * In a real implementation, this would connect to a vector database like Milvus
 */
// 添加内存存储模拟向量数据库
interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
}

const vectorStore: Record<string, VectorDocument[]> = {};

export const storeEmbeddingsInDatabase = async (
  text: string,
  datasetId: string
): Promise<boolean> => {
  try {
    const embeddings = await generateEmbedding(text);
    
    // 实际存储向量数据
    if (!vectorStore[datasetId]) {
      vectorStore[datasetId] = [];
    }
    
    vectorStore[datasetId].push({
      id: crypto.randomUUID(),
      content: text,
      embedding: embeddings
    });
    
    console.log(`Stored document in dataset ${datasetId}. Total documents: ${vectorStore[datasetId].length}`);
    return true;
  } catch (error) {
    console.error('Error storing embeddings:', error);
    throw error;
  }
};

export const enhanceQueryWithEmbeddings = async (
  query: string,
  parameters: AIParameters,
  selectedDatasetId: string | null = null
): Promise<string> => {
  try {
    if (!selectedDatasetId || !vectorStore[selectedDatasetId]) {
      return query;
    }
    
    const queryEmbedding = await generateEmbedding(query);
    console.log(`Searching in dataset: ${selectedDatasetId} for query: ${query}`);
    
    // 实现向量相似度搜索
    const documents = vectorStore[selectedDatasetId];
    const searchResults = documents
      .map(doc => ({
        ...doc,
        similarity: cosineSimilarity(queryEmbedding, doc.embedding)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3); // 获取前3个最相似的文档
    
    if (searchResults.length > 0) {
      console.log(`Found ${searchResults.length} relevant documents`);
      const relevantDocs = searchResults.map(doc => doc.content);
      return `User Query: ${query}\n\nRelevant Information:\n${relevantDocs.join('\n')}`;
    }
    
    return query;
  } catch (error) {
    console.error('Error enhancing query with embeddings:', error);
    return query;
  }
};

// 添加余弦相似度计算函数
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
