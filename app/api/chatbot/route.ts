import { NextResponse } from 'next/server';
import { createChatCompletion, type ChatMessage } from '@/lib/openrouter';

export async function POST(request: Request) {
  try {
    const { message, chatHistory = [] } = await request.json();

    // Convert the chat history to the format expected by OpenRouter
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are PriceTrack\'s AI assistant. PriceTrack is a service that helps users track product prices across multiple e-commerce sites, set alerts for price drops, and compare prices easily. Be helpful, concise, and friendly in your responses. Focus on providing information about price tracking, account management, premium features, and product recommendations.'
      },
      ...chatHistory,
      {
        role: 'user',
        content: message
      }
    ];

    try {
      // Call OpenRouter API
      const responseText = await createChatCompletion(messages);
      
      return NextResponse.json({ 
        response: responseText 
      });
    } catch (apiError: any) {
      console.error('OpenRouter API error:', apiError);
      
      // Check if it's an authentication error
      if (apiError.message && apiError.message.includes('authentication')) {
        return NextResponse.json(
          { 
            response: "I'm currently unavailable due to authentication issues. Please contact the administrator to resolve this issue.",
            error: "AUTH_ERROR"
          },
          { status: 200 } // Return 200 to show a friendly message to the user
        );
      }
      
      // For other API errors
      return NextResponse.json(
        { 
          response: "I'm having trouble connecting to my knowledge base right now. Please try again in a few moments.",
          error: "API_ERROR"
        },
        { status: 200 } // Return 200 to show a friendly message to the user
      );
    }
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
} 