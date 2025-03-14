"use client"

import { useState, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import { Chat } from "@/components/ui/chat"
import { type Message as BaseMessage } from "@/components/ui/chat-message"
import { type ChatMessage } from "@/lib/openrouter"

// Extend the base Message type to include error information
interface Message extends BaseMessage {
  error?: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Function to handle user input submission
  const handleSubmit = useCallback(
    async (e?: { preventDefault?: () => void }) => {
      e?.preventDefault?.()

      if (!input.trim() || isGenerating) return

      // Create a new user message
      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: input,
        createdAt: new Date(),
      }

      // Add user message to the chat
      setMessages((prev) => [...prev, userMessage])
      
      // Clear input field
      setInput("")
      
      // Set generating state to true
      setIsGenerating(true)

      try {
        // Convert messages to the format expected by the API
        const chatHistory: ChatMessage[] = messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));

        // Call the chatbot API
        const response = await fetch('/api/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: userMessage.content,
            chatHistory: chatHistory
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response from chatbot API');
        }

        const data = await response.json();
        
        // Create assistant message with the response
        const assistantMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: data.response,
          createdAt: new Date(),
          error: data.error || undefined, // Store error type if present
        }
        
        // Add assistant message to the chat
        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        console.error("Error generating response:", error)
        
        // Add error message
        const errorMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
          createdAt: new Date(),
          error: "CONNECTION_ERROR",
        }
        
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsGenerating(false)
      }
    },
    [input, isGenerating, messages]
  )

  // Function to handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value)
    },
    []
  )

  // Function to stop generation (if needed)
  const stopGeneration = useCallback(() => {
    setIsGenerating(false)
  }, [])

  // Sample prompt suggestions
  const suggestions = [
    "Generate a tasty vegan lasagna recipe for 3 people.",
    "Generate a list of 5 questions for a job interview for a software engineer.",
    "Who won the 2022 FIFA World Cup?",
  ]

  // Function to append a suggestion to the chat
  const appendSuggestion = useCallback(
    (message: { role: "user"; content: string }) => {
      setInput(message.content)
    },
    []
  )

  return (
    <div className="flex justify-center items-center min-h-screen bg-white p-4">
      <div className="flex flex-col w-full max-w-2xl rounded-3xl border border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="flex-grow overflow-hidden relative">
          <Chat
            messages={messages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isGenerating={isGenerating}
            stop={stopGeneration}
            append={appendSuggestion}
            suggestions={suggestions}
            className="h-[650px]"
          />
        </div>
      </div>
    </div>
  )
} 