// DeepSeek API configuration
const deepseekApiConfig = {
  baseUrl: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  model: 'deepseek-chat', // Using the DeepSeek V2.5 model
};

// Type definition for chat messages
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Function to create a chat completion with DeepSeek
export async function createChatCompletion(messages: ChatMessage[]) {
  try {
    const response = await fetch(`${deepseekApiConfig.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: deepseekApiConfig.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw error;
  }
}

// Function to create a non-streaming chat completion
export async function createChatCompletionNonStreaming(messages: any[]) {
  try {
    const response = await fetch(`${deepseekApiConfig.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: deepseekApiConfig.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw error;
  }
} 