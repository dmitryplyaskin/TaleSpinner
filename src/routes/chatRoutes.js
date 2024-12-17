const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const openRouterService = require('../services/openRouterService');

// Получение списка чатов
router.get('/chats', (req, res) => {
  try {
    const chats = chatService.getChatList();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получение конкретного чата
router.get('/chats/:chatId', (req, res) => {
  try {
    const chat = chatService.loadChat(req.params.chatId);
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создание нового сообщения в чате
router.post('/chat', async (req, res) => {
  try {
    const { prompt, chatId, settings } = req.body;
    if (!prompt) {
      throw new Error("No prompt provided");
    }

    // Добавляем сообщение пользователя
    const chat = chatService.addMessage(chatId, {
      role: "user",
      content: prompt
    });

    

    // Настраиваем SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Получаем поток ответов от OpenRouter
    const messageStream = openRouterService.streamResponse(chat.messages, settings);

    let botResponse = "";
    for await (const chunk of messageStream) {
       
      if (chunk.error) {
        res.write(`data: ${JSON.stringify({ error: chunk.error })}\n\n`);
        res.end();
        return;
      }

      botResponse += chunk.content;
      res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
    }

    // Сохраняем ответ бота
    chatService.addMessage(chatId, {
      role: "bot",
      content: botResponse
    });

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Обновление названия чата
router.put('/chats/:chatId', (req, res) => {
  console.log(req.body)
  try {
    const { title } = req.body;
    const chat = chatService.updateChatTitle(req.params.chatId, title);
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удаление чата
router.delete('/chats/:chatId', (req, res) => {
  try {
    const success = chatService.deleteChat(req.params.chatId);
    if (success) {
      res.json({ message: 'Chat deleted successfully' });
    } else {
      res.status(404).json({ error: 'Chat not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
