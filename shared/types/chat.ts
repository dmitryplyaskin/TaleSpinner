export enum ChatRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export type UserMessage = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  role: ChatRole.USER;
  content: string;
};

export type AssistantChatMessageContent = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  type: "gm" | "character";
  content: string;
};

export type AssistantMessage = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  role: ChatRole.ASSISTANT;
  content: AssistantChatMessageContent[];
};

export type SystemMessage = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  role: ChatRole.SYSTEM;
  content: string;
};

export type ChatMessage = UserMessage | AssistantMessage | SystemMessage;

export type ChatSession = {
  id: string;
  messages: ChatMessage[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
};
