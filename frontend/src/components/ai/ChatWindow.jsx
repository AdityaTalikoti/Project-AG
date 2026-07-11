import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { Sparkles, HelpCircle } from 'lucide-react';

/**
 * Chat history display area. Shows empty state suggestions or message history and handles auto-scroll.
 */
export default function ChatWindow({ messages, isLoading, error }) {
  const bottomRef = useRef(null);

  // Auto scroll to newest messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  const emptyStateSuggestions = [
    'Programming',
    'DSA',
    'Web Development',
    'Cloud Computing',
    'Career Guidance',
    'Study Planning'
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-6 py-8">
          <div className="bg-purple-500/10 p-4 rounded-full border border-purple-500/20 text-purple-400 animate-pulse">
            <Sparkles size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              Welcome to ScholarSync AI Mentor
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              I am here to guide you on your learning journey. Ask questions, clarify doubts, and discuss study strategies.
            </p>
          </div>
          <div className="bg-[#0a0e1a]/40 p-5 rounded-2xl border border-[#121829] w-full text-left space-y-3.5">
            <h4 className="text-[10px] text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle size={12} /> You can ask me about:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {emptyStateSuggestions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-gray-400 bg-[#0c1020] px-3 py-2 rounded-xl border border-gray-900 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {isLoading && <TypingIndicator />}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-xs text-rose-400 font-semibold text-center leading-relaxed">
              {error}
            </div>
          )}
          
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
