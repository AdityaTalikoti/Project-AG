import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Animated loader indicating the AI Mentor is thinking.
 */
export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-pulse">
      <div className="bg-purple-600/10 p-2 rounded-xl border border-purple-500/20 text-purple-400 mt-0.5">
        <Sparkles size={16} />
      </div>
      <div className="bg-[#0a0e1a] px-4 py-3 rounded-2xl border border-[#121829] max-w-[85%] sm:max-w-[70%]">
        <p className="text-xs font-semibold text-purple-300">
          ScholarSync AI Mentor is thinking...
        </p>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="w-1.5 h-1.5 bg-purple-400/80 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 bg-purple-400/80 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 bg-purple-400/80 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
