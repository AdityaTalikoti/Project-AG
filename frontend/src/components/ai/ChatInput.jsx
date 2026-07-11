import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

/**
 * Chat input component containing a multiline auto-growing textarea and send button.
 */
export default function ChatInput({ onSendMessage, isLoading }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !isLoading) {
      onSendMessage(trimmed);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Automatically grow the textarea height as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="flex items-end gap-2 bg-[#0a0e1a] border border-[#121829] rounded-2xl p-2 focus-within:border-purple-500/50 transition">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isLoading ? "AI Mentor is typing..." : "Ask your AI Mentor..."}
        disabled={isLoading}
        rows={1}
        className="flex-1 bg-transparent border-0 outline-none text-xs text-gray-300 resize-none max-h-[120px] py-2 px-3 placeholder-gray-650 focus:ring-0 cursor-text"
      />
      <button
        onClick={handleSend}
        disabled={isLoading || !message.trim()}
        title="Send Message"
        className={`p-2.5 rounded-xl border transition flex items-center justify-center cursor-pointer ${
          isLoading || !message.trim()
            ? 'bg-[#111625] border-gray-900 text-gray-600 cursor-not-allowed'
            : 'bg-purple-600 border-purple-500 hover:bg-purple-500 hover:border-purple-400 text-white'
        }`}
      >
        <Send size={14} />
      </button>
    </div>
  );
}
