// OpenRouter API configuration
const openRouterConfig = {
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  model: 'google/gemma-3-27b-it:free', // Using Google's Gemma 3 27B model
  siteInfo: {
    referer: process.env.SITE_URL || 'http://localhost:3000',
    title: 'PriceTrack Assistant'
  }
};

// Type definition for chat messages
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Function to create a chat completion with OpenRouter
export async function createChatCompletion(messages: ChatMessage[]) {
  try {
    const response = await fetch(`${openRouterConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterConfig.apiKey}`,
        'HTTP-Referer': openRouterConfig.siteInfo.referer,
        'X-Title': openRouterConfig.siteInfo.title
      },
      body: JSON.stringify({
        model: openRouterConfig.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw error;
  }
} 