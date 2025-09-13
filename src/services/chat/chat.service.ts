import { GameSessionsChatJsonService } from "@services/game-sessions/files";
import { UserMessage, ChatRole, ChatMessage } from "@shared/types/chat";
import { v4 as uuidv4 } from "uuid";

export const addNewUserMessage = async ({
  content,
  role,
  sessionId,
  chatId,
}: {
  content: string;
  role: ChatRole.USER;
  sessionId: string;
  chatId: string;
}) => {
  const chatList = await GameSessionsChatJsonService.readFile(
    sessionId + "/chat/" + chatId
  );
  if (!chatList) {
    throw new Error("Chat not found");
  }

  const newMessage: UserMessage = {
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    content,
    role,
  };

  chatList.messages.push(newMessage);

  await GameSessionsChatJsonService.updateFile(
    sessionId + "/chat/" + chatId,
    chatList
  );
  return newMessage;
};

export const deleteMessage = async ({
  sessionId,
  chatId,
  messageId,
}: {
  sessionId: string;
  chatId: string;
  messageId: string;
}) => {
  const chatList = await GameSessionsChatJsonService.readFile(
    sessionId + "/chat/" + chatId
  );
  if (!chatList) {
    throw new Error("Chat not found");
  }
  chatList.messages = chatList.messages.filter(
    (message) => message.id !== messageId
  );
  await GameSessionsChatJsonService.updateFile(
    sessionId + "/chat/" + chatId,
    chatList
  );
  return chatList;
};

export const editMessage = async ({
  sessionId,
  chatId,
  messageId,
  content,
}: {
  sessionId: string;
  chatId: string;
  messageId: string;
  content: string;
}) => {
  const chatList = await GameSessionsChatJsonService.readFile(
    sessionId + "/chat/" + chatId
  );
  if (!chatList) {
    throw new Error("Chat not found");
  }
  chatList.messages = chatList.messages.map((message) =>
    message.id === messageId ? { ...message, content } : message
  ) as ChatMessage[];
  await GameSessionsChatJsonService.updateFile(
    sessionId + "/chat/" + chatId,
    chatList
  );
  return chatList;
};
