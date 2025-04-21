"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sendChatMessage, getChatSessions, getChatSessionDetails } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import {
  Send,
  User,
  Bot,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Copy,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { CACHE_KEYS } from "@/lib/cache-manager"
import { useNavigationManager } from "@/lib/navigation-manager"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ReactMarkdown from "react-markdown"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"

type Message = {
  id?: number
  sender_type: "user" | "bot"
  message: string
  created_at: string
  is_streaming?: boolean
  retry_count?: number
  sources?: Array<{
    id: number
    title: string
    url: string
    category: string
  }> | null
}

type ChatSession = {
  id: number
  title: string
  created_at: string
  updated_at: string
  last_message: {
    message: string
    sender_type: "user" | "bot"
    created_at: string
  } | null
}

export default function ChatPage() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const { preloadRoute } = useNavigationManager()
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">("online")
  const abortControllerRef = useRef<AbortController | null>(null)
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false)
  const initialRenderComplete = useRef(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"chat" | "sessions">("chat")
  const [isQuickChatExpanded, setIsQuickChatExpanded] = useState(false)

  // Use SWR for sessions data - disable periodic revalidation
  const {
    data: sessionsData,
    error: sessionsError,
    mutate: mutateSessions,
    isLoading: isLoadingSessions,
  } = useCachedFetch<any>(CACHE_KEYS.CHAT_SESSIONS, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0, // Disable periodic fetching
    dedupingInterval: 10000, // 10 seconds
    prioritizePrefetchedData: true,
    backgroundUpdate: true,
  })

  // Ensure sessions is always an array
  const sessions: ChatSession[] = Array.isArray(sessionsData) ? sessionsData : sessionsData?.data || []

  // Use SWR for current session details - disable periodic revalidation
  const {
    data: sessionDetailsData,
    error: sessionDetailsError,
    isLoading: isLoadingSessionDetails,
    mutate: mutateSessionDetails,
  } = useCachedFetch<any>(currentSessionId ? CACHE_KEYS.CHAT_SESSION(currentSessionId) : null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0, // Disable periodic fetching
    dedupingInterval: 5000, // 5 seconds
    prioritizePrefetchedData: true,
    backgroundUpdate: true,
  })

  // Ensure session details is properly structured
  const sessionDetails = sessionDetailsData?.data || sessionDetailsData

  // Update messages when session details change
  useEffect(() => {
    if (sessionDetails && sessionDetails.messages) {
      setMessages(sessionDetails.messages)
    }
  }, [sessionDetails])

  // Set error state if any fetch fails
  useEffect(() => {
    if (sessionsError) {
      setLoadingError("Failed to load chat sessions. Please try again.")
    } else if (sessionDetailsError && currentSessionId) {
      setLoadingError("Failed to load messages. Please try again.")
    } else {
      setLoadingError(null)
    }
  }, [sessionsError, sessionDetailsError, currentSessionId])

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus("online")
      toast({
        title: "You're back online",
        description: "Connection restored. You can continue chatting.",
        variant: "default",
      })

      // Manually trigger revalidation when coming back online
      mutateSessions()
      if (currentSessionId) {
        mutateSessionDetails()
      }
    }

    const handleOffline = () => {
      setNetworkStatus("offline")
      toast({
        title: "You're offline",
        description: "Check your internet connection to continue chatting.",
        variant: "destructive",
      })
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast, mutateSessions, mutateSessionDetails, currentSessionId])

  // Set initial session when sessions load
  useEffect(() => {
    if (sessions && sessions.length > 0 && !currentSessionId && !isLoadingSessions) {
      setCurrentSessionId(sessions[0].id)
    }
  }, [sessions, currentSessionId, isLoadingSessions])

  // Prefetch session details for other sessions
  useEffect(() => {
    if (sessions && sessions.length > 0 && !isLoadingSessions && initialRenderComplete.current) {
      // Prefetch the next 2 sessions that aren't the current one
      const sessionsToPreload = sessions.filter((session) => session.id !== currentSessionId).slice(0, 2)

      sessionsToPreload.forEach((session) => {
        // Use the API function directly to prefetch
        getChatSessionDetails(session.id).catch(console.error)
      })
    }

    // Mark initial render as complete after first render
    if (!initialRenderComplete.current) {
      initialRenderComplete.current = true
    }
  }, [sessions, currentSessionId, isLoadingSessions])

  // Prefetch other main sections
  useEffect(() => {
    preloadRoute("/dashboard/health")
    preloadRoute("/dashboard/resources")
    preloadRoute("/dashboard/profile")
  }, [preloadRoute])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      // Use scrollIntoView with a specific container
      const scrollContainer = chatContainerRef.current

      // Only scroll the chat container, not the whole page
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      })
    }
  }, [messages])

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading || networkStatus === "offline") return

    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController()

    const sentMessage = message.trim()
    setMessage("")

    // Generate temporary IDs for optimistic updates
    const tempUserMessageId = `temp-user-${Date.now()}`
    const tempBotMessageId = `temp-bot-${Date.now()}`

    // Add messages in a single state update with IDs for tracking
    setMessages((prev) => {
      const newUserMessage: Message = {
        id: tempUserMessageId as any, // Temporary ID
        sender_type: "user",
        message: sentMessage,
        created_at: new Date().toISOString(),
      }

      const placeholderBotMessage: Message = {
        id: tempBotMessageId as any, // Temporary ID
        sender_type: "bot",
        message: "",
        created_at: new Date().toISOString(),
        is_streaming: true,
      }

      return [...prev, newUserMessage, placeholderBotMessage]
    })

    setIsLoading(true)

    try {
      // Send the message to the API
      const response = await sendChatMessage(sentMessage, currentSessionId, abortControllerRef.current.signal)

      // If this is a new session, update the current session ID and refresh sessions
      if (!currentSessionId && response.session_id) {
        setCurrentSessionId(response.session_id)
        mutateSessions()
      }

      // Update the bot message with the response
      if (response.message) {
        setMessages((prev) => {
          const newMessages = [...prev]
          // Find the temporary bot message by ID
          const botMessageIndex = newMessages.findIndex((m) => m.id === tempBotMessageId)

          if (botMessageIndex !== -1) {
            // Update the temporary message with real data
            newMessages[botMessageIndex] = {
              ...newMessages[botMessageIndex],
              id: response.id || newMessages[botMessageIndex].id,
              message: response.message,
              is_streaming: false,
              sources: response.sources || null,
            }
          } else {
            // Fallback: Add a new bot message if we couldn't find the temporary one
            newMessages.push({
              id: response.id,
              sender_type: "bot",
              message: response.message,
              created_at: new Date().toISOString(),
              sources: response.sources || null,
            })
          }

          return newMessages
        })

        // Update the session details cache
        if (currentSessionId) {
          mutateSessionDetails()
        }

        // Update the sessions list to reflect the new message
        mutateSessions()
      }
    } catch (error) {
      // Only handle error if it's not an abort error
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Error sending message:", error)

        // Update the bot message with an error
        setMessages((prev) => {
          const newMessages = [...prev]
          // Find the temporary bot message by ID
          const botMessageIndex = newMessages.findIndex((m) => m.id === tempBotMessageId)

          if (botMessageIndex !== -1) {
            newMessages[botMessageIndex] = {
              ...newMessages[botMessageIndex],
              message: "Sorry, I encountered an error. Please try again.",
              is_streaming: false,
              retry_count: 0,
            }
          }

          return newMessages
        })

        toast({
          title: "Error sending message",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  // Retry sending a failed message
  const retryMessage = async (index: number) => {
    const userMessageIndex = index - 1
    if (userMessageIndex < 0 || !messages[userMessageIndex]) return

    const userMessage = messages[userMessageIndex]
    if (userMessage.sender_type !== "user") return

    // Update the bot message to show it's retrying
    setMessages((prev) => {
      const newMessages = [...prev]
      const botMessage = newMessages[index]

      if (botMessage) {
        botMessage.is_streaming = true
        botMessage.message = ""
        botMessage.retry_count = (botMessage.retry_count || 0) + 1
      }

      return newMessages
    })

    setIsLoading(true)

    try {
      // Create a new abort controller for this request
      abortControllerRef.current = new AbortController()

      // Retry sending the message
      const response = await sendChatMessage(userMessage.message, currentSessionId, abortControllerRef.current.signal)

      // Update the bot message with the response
      if (response.message) {
        setMessages((prev) => {
          const newMessages = [...prev]
          const botMessage = newMessages[index]

          if (botMessage) {
            botMessage.message = response.message
            botMessage.is_streaming = false
            botMessage.sources = response.sources || null
          }

          return newMessages
        })

        // Update the session details cache
        if (currentSessionId) {
          mutateSessionDetails()
        }
      }
    } catch (error) {
      // Only handle error if it's not an abort error
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Error retrying message:", error)

        // Update the bot message with an error
        setMessages((prev) => {
          const newMessages = [...prev]
          const botMessage = newMessages[index]

          if (botMessage) {
            botMessage.message = "Sorry, I encountered an error. Please try again."
            botMessage.is_streaming = false
          }

          return newMessages
        })

        toast({
          title: "Error retrying message",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  // Copy message to clipboard
  const copyMessageToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Message content copied to clipboard",
          variant: "default",
        })
      })
      .catch((error) => {
        console.error("Error copying to clipboard:", error)
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard",
          variant: "destructive",
        })
      })
  }

  // Start a new chat
  const startNewChat = async () => {
    try {
      setIsCreatingNewChat(true)

      // Create a new chat session via API
      const response = await fetch("https://diax.fileish.com/api/chat/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: "New Conversation",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create new chat session")
      }

      const data = await response.json()

      // If we successfully created a session, set it as current
      if (data && data.data && data.data.id) {
        setCurrentSessionId(data.data.id)
      } else {
        // Otherwise just reset the current session
        setCurrentSessionId(null)
      }

      // Reset messages
      setMessages([])
      setLoadingError(null)

      // Force refresh of sessions list
      await mutateSessions()

      // Switch to chat tab
      setActiveTab("chat")

      toast({
        title: "New chat created",
        description: "You can start a new conversation",
        variant: "default",
      })
    } catch (error) {
      console.error("Error creating new chat session:", error)
      toast({
        title: "Error creating new chat",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })

      // Even if API call fails, still reset the current chat
      setCurrentSessionId(null)
      setMessages([])
    } finally {
      setIsCreatingNewChat(false)
    }
  }

  // Select a session
  const selectSession = (sessionId: number) => {
    if (isLoading) return

    setCurrentSessionId(sessionId)
    // Switch to chat tab after selecting a session
    setActiveTab("chat")
  }

  // Delete a session
  const deleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      const response = await fetch(`https://diax.fileish.com/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete session")
      }

      // If the deleted session was the current one, clear the messages and reset currentSessionId
      if (currentSessionId === sessionId) {
        setMessages([])
        setCurrentSessionId(null)
      }

      // Update the sessions list
      mutateSessions()

      toast({
        title: "Session deleted",
        description: "Chat session has been deleted",
        variant: "default",
      })
    } catch (error) {
      console.error("Error deleting session:", error)
      toast({
        title: "Error deleting session",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  // Cancel ongoing request
  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null

      // Update the bot message to show it was cancelled
      setMessages((prev) => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]

        if (lastMessage && lastMessage.is_streaming) {
          lastMessage.message = "Message generation was cancelled."
          lastMessage.is_streaming = false
        }

        return newMessages
      })

      setIsLoading(false)
    }
  }

  // Handle quick message selection
  const handleQuickMessage = (text: string) => {
    setMessage(text)
    setIsQuickChatExpanded(false)
  }

  // Refresh sessions
  const refreshSessions = async () => {
    try {
      await getChatSessions()
      mutateSessions()
      toast({
        title: "Sessions refreshed",
        description: "Chat sessions have been updated",
        variant: "default",
      })
    } catch (error) {
      console.error("Error refreshing sessions:", error)
      toast({
        title: "Error refreshing sessions",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    }
  }

  // Quick chat messages
  const commonMessages = [
    {
      text: "What's my blood sugar trend?",
      category: "stats",
    },
    {
      text: "How can I lower my A1C?",
      category: "advice",
    },
    {
      text: "What foods should I avoid?",
      category: "nutrition",
    },
    {
      text: "What are symptoms of low blood sugar?",
      category: "health",
    },
    {
      text: "What exercises are best for diabetes?",
      category: "activity",
    },
    {
      text: "How does stress affect diabetes?",
      category: "lifestyle",
    },
  ]

  // Update the main container to use the new wrapper class
  return (
    <div className="flex flex-col h-full chat-page-container">
      {/* Header with title and new chat button */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-cyan-500" />
            DiaX Assistant
          </h1>
          <p className="text-muted-foreground">Ask questions about diabetes management</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={startNewChat}
          disabled={isCreatingNewChat}
          className="bg-gradient-to-r from-cyan-600/10 to-teal-600/10 border-cyan-500/30"
        >
          <Plus className="mr-2 h-4 w-4" />
          {isCreatingNewChat ? "Creating..." : "New Chat"}
        </Button>
      </div>

      {/* Tabs for chat and sessions */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "chat" | "sessions")}
        className="flex-1 flex flex-col"
      >
        <div className="border-b">
          <TabsList className="w-full justify-start h-10 bg-transparent p-0">
            <TabsTrigger
              value="chat"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none h-10 px-4"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none h-10 px-4"
            >
              <Clock className="h-4 w-4 mr-2" />
              Sessions
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden tabs-content-container">
          {/* Chat Tab Content */}
          <TabsContent value="chat" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden p-0">
            {/* Chat Messages Container */}
            <div
              className="flex-1 overflow-y-auto py-4 chat-scroll-container"
              ref={chatContainerRef}
              style={{
                height: "calc(100vh - 16rem)",
                maxHeight: "calc(100vh - 16rem)",
                overflowY: "auto",
                position: "relative", // Add position relative
              }}
            >
              {isLoadingSessionDetails ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-2">
                      <div className="h-8 w-8 bg-muted/60 rounded-full animate-pulse"></div>
                      <div className="h-16 flex-1 bg-muted/40 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4 pr-2">
                  {messages.map((msg, index) => (
                    <div
                      key={msg.id || index}
                      className={`flex gap-2 ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.sender_type === "bot" && (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center text-white shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.sender_type === "user"
                            ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white"
                            : "bg-muted"
                        }`}
                      >
                        {msg.is_streaming ? (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-cyan-500 rounded-full animate-pulse"></div>
                            <div className="h-2 w-2 bg-cyan-500 rounded-full animate-pulse delay-150"></div>
                            <div className="h-2 w-2 bg-cyan-500 rounded-full animate-pulse delay-300"></div>
                            <span className="ml-2 text-sm">Generating response...</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={cancelRequest}>
                              <X className="h-3 w-3" />
                              <span className="sr-only">Cancel</span>
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="markdown-content">
                              <ReactMarkdown>{msg.message}</ReactMarkdown>
                            </div>
                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-border">
                                <p className="text-xs font-medium mb-1">Sources:</p>
                                <ul className="text-xs space-y-1">
                                  {msg.sources.map((source) => (
                                    <li key={source.id}>
                                      <a
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-500 hover:underline"
                                      >
                                        {source.title}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-2 pt-1 border-t border-border/30">
                              <p className="text-xs opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</p>
                              {msg.sender_type === "bot" && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-70 hover:opacity-100"
                                    onClick={() => copyMessageToClipboard(msg.message)}
                                  >
                                    <Copy className="h-3 w-3" />
                                    <span className="sr-only">Copy</span>
                                  </Button>
                                  {msg.retry_count !== undefined && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-70 hover:opacity-100"
                                      onClick={() => retryMessage(index)}
                                    >
                                      <RefreshCw className="h-3 w-3" />
                                      <span className="sr-only">Retry</span>
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {msg.sender_type === "user" && (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} style={{ height: "1px", marginBottom: "16px" }} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-12">
                  <div className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 p-4 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-cyan-500" />
                  </div>
                  <h3 className="text-lg font-medium">How can I help you today?</h3>
                  <p className="text-muted-foreground text-center mt-2 mb-6 max-w-md px-4">
                    Ask me questions about diabetes management, treatment options, lifestyle tips, or anything else
                    related to your health.
                  </p>
                </div>
              )}
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="chat-input-area">
              <div className="space-y-2">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                    className="flex-1 chat-input"
                    disabled={isLoading || networkStatus === "offline"}
                  />
                  <Button
                    type="submit"
                    disabled={!message.trim() || isLoading || networkStatus === "offline"}
                    className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="sr-only">Send</span>
                  </Button>
                </form>

                {/* Quick Chat Messages - Now positioned below the input */}
                <div className="w-full relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsQuickChatExpanded(!isQuickChatExpanded)}
                    className="w-full flex justify-between items-center bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-300 rounded-full px-3 py-1"
                  >
                    <div className="flex items-center">
                      <MessageSquare className="h-3.5 w-3.5 mr-2" />
                      <span className="text-xs">Quick Questions</span>
                    </div>
                    {isQuickChatExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  <AnimatePresence>
                    {isQuickChatExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, y: 0 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-0 right-0 bg-background border border-border rounded-lg mb-2 overflow-hidden shadow-lg"
                      >
                        <div className="flex flex-wrap gap-2 p-3">
                          {commonMessages.map((msg, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleQuickMessage(msg.text)
                                }}
                                className="text-xs bg-slate-800/50 border-slate-700 hover:bg-slate-700 hover:text-white text-slate-300 rounded-full px-3 py-1"
                              >
                                {msg.text}
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {networkStatus === "offline" && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>You're offline</AlertTitle>
                    <AlertDescription>Check your internet connection to continue chatting.</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Sessions Tab Content - No changes needed here */}
          <TabsContent value="sessions" className="flex-1 m-0 data-[state=inactive]:hidden p-0 overflow-y-auto">
            <div className="py-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Your Conversations</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshSessions}
                  disabled={isLoadingSessions}
                  className="h-8 w-8 rounded-full"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingSessions ? "animate-spin" : ""}`} />
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>

              {loadingError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{loadingError}</AlertDescription>
                </Alert>
              )}

              {isLoadingSessions ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted/40 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : sessions?.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((session: ChatSession) => (
                    <div
                      key={session.id}
                      className={`relative group rounded-lg overflow-hidden ${
                        currentSessionId === session.id
                          ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white"
                          : "bg-muted/20 hover:bg-muted/40"
                      }`}
                    >
                      <Button
                        variant="ghost"
                        className={`w-full justify-start h-auto py-3 px-4 ${
                          currentSessionId === session.id ? "text-white hover:bg-transparent" : ""
                        }`}
                        onClick={() => selectSession(session.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 shrink-0 mt-0.5" />
                          <div className="truncate text-left">
                            <div className="font-medium truncate">
                              {session.title || `Chat ${session.id.toString().slice(0, 8)}`}
                            </div>
                            <div className="text-xs opacity-70 mt-1">
                              {new Date(session.created_at).toLocaleDateString()}
                            </div>
                            {session.last_message && (
                              <div className="text-xs opacity-70 truncate mt-1">
                                <span className="font-medium">
                                  {session.last_message.sender_type === "user" ? "You: " : "DiaX: "}
                                </span>
                                {session.last_message.message.substring(0, 50)}
                                {session.last_message.message.length > 50 ? "..." : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ${
                          currentSessionId === session.id ? "text-white hover:bg-white/20" : ""
                        }`}
                        onClick={(e) => deleteSession(session.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 p-4 rounded-full mx-auto w-16 h-16 flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-cyan-500" />
                  </div>
                  <h3 className="text-lg font-medium">No conversations yet</h3>
                  <p className="text-muted-foreground mt-2 mb-6">Start a new chat to begin</p>
                  <Button
                    onClick={startNewChat}
                    className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Conversation
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
