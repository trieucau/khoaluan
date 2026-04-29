import chatbotService from '../services/chatbotService';

const chat = async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = req.user.id; // inject bởi verifyTokenUser middleware

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        errCode: 1,
        errMessage: 'Missing messages array',
      });
    }

    // Kiểm tra message cuối phải là của user
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.content?.trim()) {
      return res.status(400).json({
        errCode: 2,
        errMessage: 'Empty message content',
      });
    }

    // Giới hạn history để tránh vượt context window
    const MAX_HISTORY = 20;
    const trimmedMessages = messages.slice(-MAX_HISTORY);

    // Streaming response — chatbotService sẽ tự gọi res.write() và res.end()
    await chatbotService.chatWithGemini(userId, trimmedMessages, res);
  } catch (error) {
    console.error('[chatbotController] Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        errCode: -1,
        errMessage: 'Error from server',
      });
    }
  }
};

export default { chat };
