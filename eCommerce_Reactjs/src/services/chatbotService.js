// src/services/chatbotService.js

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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

      // ⚠️ FIX 1: check body tồn tại
      if (!response.body) {
        onError?.('Server không hỗ trợ streaming');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // ✅ FIX 2: decode an toàn hơn
        buffer += decoder.decode(value, { stream: true });

        // ✅ FIX 3: split chuẩn (CRLF + LF)
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop(); // giữ lại phần JSON chưa hoàn chỉnh

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;

          // ✅ FIX 4: remove "data:" robust hơn
          const raw = line.replace(/^data:\s*/, '').trim();

          if (!raw) continue;

          console.log('RAW:', raw);

          try {
            const parsed = JSON.parse(raw);

            if (parsed.type === 'chunk') {
              onChunk?.(parsed.text);
            } else if (parsed.type === 'tool_call') {
              onToolCall?.(parsed.name);
            } else if (parsed.type === 'done') {
              onDone?.();
              return; // ✅ FIX 5: STOP ngay (tránh nhận chunk rác sau done)
            } else if (parsed.type === 'error') {
              onError?.(parsed.text);
              return;
            }
          } catch (e) {
            // ⚠️ FIX 6: log lỗi parse để debug
            console.log('PARSE ERROR:', raw);
          }
        }
      }

      // ✅ FIX 7: nếu stream kết thúc mà chưa có done → vẫn gọi onDone
      onDone?.();
    } catch (err) {
      if (err.name === 'AbortError') return;
      onError?.('Mất kết nối, vui lòng thử lại');
    }
  };

  run();
  return () => controller.abort();
};
