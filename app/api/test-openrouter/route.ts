import { NextResponse } from 'next/server';
import { createChatCompletion, type ChatMessage } from '@/lib/openrouter';

export async function GET() {
  try {
    // Test message for OpenRouter
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: 'Hello, can you tell me about Google Gemma 3 27B?'
      }
    ];

    // Call OpenRouter API
    const response = await createChatCompletion(messages);

    return NextResponse.json({ 
      success: true,
      response: response,
      apiKey: process.env.OPENROUTER_API_KEY ? 'API key is set' : 'API key is not set',
      model: 'google/gemma-3-27b-it:free'
    });
  } catch (error) {
    console.error('Test OpenRouter API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKey: process.env.OPENROUTER_API_KEY ? 'API key is set' : 'API key is not set'
      },
      { status: 500 }
    );
  }
} 