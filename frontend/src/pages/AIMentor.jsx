import React from 'react';
import ChatWindow from '../components/ai/ChatWindow';
import ChatInput from '../components/ai/ChatInput';
import { useChat } from '../hooks/useChat';
import { Sparkles, Trash2 } from 'lucide-react';

/**
 * Dedicated AIMentor page coordinating message logs, text inputs, and navigation actions.
 */
export default function AIMentor() {
  const { messages, isLoading, error, sendMessage, clearChat } = useChat();

  return (
    <div className="flex flex-col bg-[#0a0e1a]/20 border border-[#121829] rounded-2xl h-[calc(100vh-160px)] min-h-[450px] max-h-screen overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#0a0e1a]/40 p-5 border-b border-[#121829] flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="text-purple-400" size={16} />
            ScholarSync AI Mentor
          </h1>
          <p className="text-[10px] sm:text-xs text-gray-400">
            Your AI-powered study companion. Ask questions, clear doubts, and improve your learning.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            title="Clear Chat"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-500/20 hover:bg-rose-500/5 text-rose-400 hover:text-rose-300 rounded-xl text-[10px] font-bold tracking-wide transition cursor-pointer"
          >
            <Trash2 size={12} />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>

      {/* Chat Content Panel */}
      <div className="flex-1 flex flex-col bg-[#050811]/60 min-h-0">
        <ChatWindow 
          messages={messages} 
          isLoading={isLoading} 
          error={error} 
        />
      </div>

      {/* Chat Input Panel */}
      <div className="p-4 bg-[#0a0e1a]/40 border-t border-[#121829] flex-shrink-0">
        <ChatInput 
          onSendMessage={sendMessage} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}
