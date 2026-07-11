import React from 'react';
import { Sparkles, GraduationCap } from 'lucide-react';

/**
 * Message component displaying message text, sender avatar, and timestamp.
 */
export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`p-2 rounded-xl border mt-0.5 flex-shrink-0 ${
        isUser 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
          : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
      }`}>
        {isUser ? <GraduationCap size={16} /> : <Sparkles size={16} />}
      </div>

      {/* Bubble */}
      <div className={`px-4 py-3 rounded-2xl border max-w-[85%] sm:max-w-[70%] space-y-1 ${
        isUser 
          ? 'bg-[#111625] border-[#1b2237] text-gray-200 rounded-tr-none' 
          : 'bg-[#0a0e1a] border-[#121829] text-gray-300 rounded-tl-none'
      }`}>
        {/* Message Text */}
        <p className="text-xs leading-relaxed whitespace-pre-wrap selection:bg-purple-500/30">
          {message.text}
        </p>
        {/* Message Time */}
        <span className="block text-[8px] text-gray-500 font-mono text-right">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
