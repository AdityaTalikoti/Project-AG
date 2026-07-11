import { useState, useCallback } from 'react';
import { sendChatMessage } from '../services/aiApi.js';

/**
 * Hook to manage AI chat messages list, API loading and error states.
 */
export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (text) => {
    if (!text || text.trim() === '') return;

    setError(null);
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const result = await sendChatMessage(text);

    setIsLoading(false);

    if (result.success && result.reply) {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: result.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } else {
      setError(result.message || 'Unable to contact ScholarSync AI Mentor. Please try again.');
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
};
