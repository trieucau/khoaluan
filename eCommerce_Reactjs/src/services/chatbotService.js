// src/services/chatbotService.js
// Dùng fetch (không dùng axios) vì axios không hỗ trợ SSE streaming tốt

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Gửi messages lên server và nhận stream response
 * @param {Array} messages - [{role: 'user'|'assistant', content: string}]
 * @param {Function} onChunk - callback nhận từng đoạn text (string)
 * @param {Function} onToolCall - callback khi AI đang query DB (string tên tool)
 * @param {Function} onDone - callback khi stream kết thúc
 * @param {Function} onError - callback khi có lỗi (string)
 * @returns {Function} abort function để cancel request
 */
export const sendChatMessage = (messages, { onChunk, onToolCall, onDone, onError }) => {
  const controller = new AbortController();
  const token = localStorage.getItem('token')?.replaceAll('"', '');

  const run = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        onError?.(err.errMessage || 'Lỗi kết nối server');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // giữ dòng dang dở

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === 'chunk') onChunk?.(parsed.text);
            else if (parsed.type === 'tool_call') onToolCall?.(parsed.name);
            else if (parsed.type === 'done') onDone?.();
            else if (parsed.type === 'error') onError?.(parsed.text);
          } catch {
            // bỏ qua dòng lỗi parse
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // user cancel — không báo lỗi
      onError?.('Mất kết nối, vui lòng thử lại');
    }
  };

  run();
  return () => controller.abort(); // trả về hàm cancel
};
