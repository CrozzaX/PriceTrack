import { NextResponse } from 'next/server';
import { createChatCompletion, type ChatMessage } from '@/lib/deepseek';

export async function GET() {
  try {
    // Test message for DeepSeek
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: 'Hello, can you tell me about DeepSeek?'
      }
    ];

    // Call DeepSeek API
    const response = await createChatCompletion(messages);

    return NextResponse.json({ 
      success: true,
      response: response,
      apiKey: process.env.DEEPSEEK_API_KEY ? 'API key is set' : 'API key is not set'
    });
  } catch (error) {
    console.error('Test DeepSeek API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKey: process.env.DEEPSEEK_API_KEY ? 'API key is set' : 'API key is not set'
      },
      { status: 500 }
    );
  }
} 