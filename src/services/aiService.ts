
import { AIParameters } from '@/components/ParameterControls';

// The API key for DeepSeek-V3
const API_KEY = 'sk-kekjunkrrsvukzjwakjpgpzivkopchkvqvxorvrmpzuvhbtm';
const API_BASE_URL = 'https://api.siliconflow.cn/v1';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatCompletionRequest {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  temperature: number;
  top_p: number;
  top_k: number;
  frequency_penalty: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  content: string;
}

export const generateChatResponse = async (
  messages: Message[],
  parameters: AIParameters,
  abortSignal?: AbortSignal,
  onStreamUpdate?: (content: string) => void
): Promise<ChatResponse> => {
  try {
    // Format messages for the API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const requestBody: ChatCompletionRequest = {
      model: 'deepseek-ai/DeepSeek-V3',
      messages: formattedMessages,
      temperature: parameters.temperature,
      top_p: parameters.topP,
      top_k: parameters.topK,
      frequency_penalty: parameters.frequencyPenalty,
      stream: !!onStreamUpdate
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    };

    // If streaming is requested
    if (onStreamUpdate) {
      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: abortSignal
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get AI response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      let accumulatedContent = '';
      const decoder = new TextDecoder();

      return new Promise((resolve, reject) => {
        function processStream({ done, value }: ReadableStreamReadResult<Uint8Array>) {
          if (done) {
            resolve({
              id: crypto.randomUUID(),
              content: accumulatedContent
            });
            return;
          }

          try {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content || '';
                  if (content) {
                    accumulatedContent += content;
                    onStreamUpdate(accumulatedContent);
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
            
            reader.read().then(processStream).catch(reject);
          } catch (error) {
            reject(error);
          }
        }

        reader.read().then(processStream).catch(reject);
      });
    } 
    // Non-streaming request
    else {
      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: abortSignal
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get AI response');
      }

      const data = await response.json();
      
      return {
        id: data.id || crypto.randomUUID(),
        content: data.choices[0]?.message?.content || ''
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request was aborted');
    }
    throw error;
  }
};
