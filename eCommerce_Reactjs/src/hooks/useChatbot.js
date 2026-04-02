import { useState, useRef, useCallback, useEffect } from 'react';
import { sendChatMessage } from '../services/chatbotService';

const TOOL_LABELS = {
  getMyOrders: '🔍 Đang tra cứu đơn hàng...',
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
  const [toolStatus, setToolStatus] = useState('');

  const abortRef = useRef(null);
  const streamingIdRef = useRef(null);

  // ✅ FIX 1: tránh stale state
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

      // ✅ FIX 2: dùng ref thay vì messages
      const history = [...messagesRef.current, userMsg]
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      abortRef.current = sendChatMessage(history, {
        onChunk: (chunk) => {
          console.log('CHUNK RECEIVED:', chunk);
          setToolStatus('');

          // ✅ FIX 3: tránh mất chunk (race condition)
          setMessages((prev) => {
            const newMessages = [...prev];
            const idx = newMessages.findIndex((m) => m.id === streamingIdRef.current);
            if (idx !== -1) {
              newMessages[idx] = {
                ...newMessages[idx],
                content: (newMessages[idx].content || '') + chunk,
              };
            } else {
              console.log('⚠️ Không tìm thấy message để append chunk');
            }
            return newMessages;
          });
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

          // ✅ FIX 4: delay reset để tránh mất chunk cuối
          setTimeout(() => {
            streamingIdRef.current = null;
          }, 100);
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

          // ✅ delay giống onDone
          setTimeout(() => {
            streamingIdRef.current = null;
          }, 100);
        },
      });
    },
    [isLoading]
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
