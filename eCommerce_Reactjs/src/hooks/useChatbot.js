// src/hooks/useChatbot.js

import { useState, useRef, useCallback } from 'react';

import { sendChatMessage } from '../services/chatbotService';

const TOOL_LABELS = {
  getOrdersByUser: '🔍 Đang tra cứu đơn hàng...',
  searchProducts: '🛍️ Đang tìm sản phẩm...',
  getAvailableVouchers: '🎟️ Đang lấy danh sách voucher...',
};

const useChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào! Mình là trợ lý AI của shop 👋\nMình có thể giúp bạn tư vấn sản phẩm, tra đơn hàng hoặc tìm mã giảm giá. Bạn cần hỗ trợ gì?',

      isStreaming: false,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const [toolStatus, setToolStatus] = useState(''); // "Đang tra cứu..."

  const abortRef = useRef(null);

  const streamingIdRef = useRef(null);

  const sendMessage = useCallback(
    (text) => {
      if (!text.trim() || isLoading) return;

      const userMsg = {
        id: `user-${Date.now()}`,

        role: 'user',

        content: text.trim(),

        isStreaming: false,
      };

      const assistantId = `assistant-${Date.now()}`;

      const assistantMsg = {
        id: assistantId,

        role: 'assistant',

        content: '',

        isStreaming: true,
      };

      streamingIdRef.current = assistantId;

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      setIsLoading(true);

      setToolStatus('');

      // Xây history để gửi lên (bỏ welcome message + chỉ lấy role/content)

      const history = [...messages, userMsg]

        .filter((m) => m.id !== 'welcome')

        .map((m) => ({ role: m.role, content: m.content }));

      abortRef.current = sendChatMessage(history, {
        onChunk: (chunk) => {
          setToolStatus('');

          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingIdRef.current ? { ...m, content: m.content + chunk } : m
            )
          );
        },

        onToolCall: (toolName) => {
          setToolStatus(TOOL_LABELS[toolName] || '⏳ Đang xử lý...');
        },

        onDone: () => {
          setIsLoading(false);

          setToolStatus('');

          setMessages((prev) =>
            prev.map((m) => (m.id === streamingIdRef.current ? { ...m, isStreaming: false } : m))
          );

          streamingIdRef.current = null;
        },

        onError: (errText) => {
          setIsLoading(false);

          setToolStatus('');

          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingIdRef.current
                ? {
                    ...m,

                    content: errText || 'Đã xảy ra lỗi, vui lòng thử lại.',

                    isStreaming: false,
                  }
                : m
            )
          );

          streamingIdRef.current = null;
        },
      });
    },

    [messages, isLoading]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.();

    setIsLoading(false);

    setToolStatus('');

    setMessages((prev) =>
      prev.map((m) => (m.id === streamingIdRef.current ? { ...m, isStreaming: false } : m))
    );

    streamingIdRef.current = null;
  }, []);

  const clearHistory = useCallback(() => {
    stopStreaming();

    setMessages([
      {
        id: 'welcome',

        role: 'assistant',

        content:
          'Xin chào! Mình là trợ lý AI của shop 👋\nMình có thể giúp bạn tư vấn sản phẩm, tra đơn hàng hoặc tìm mã giảm giá. Bạn cần hỗ trợ gì?',

        isStreaming: false,
      },
    ]);
  }, [stopStreaming]);

  return {
    messages,

    isLoading,

    toolStatus,

    sendMessage,

    stopStreaming,

    clearHistory,
  };
};

export default useChatbot;
