export enum ChatRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export type UserMessage = {
  role: ChatRole.USER;
  content: string;
};

export type AssistantChatMessageContent = {
  type: "gm" | "character";
  content: string;
};

export type AssistantMessage = {
  role: ChatRole.ASSISTANT;
  content: AssistantChatMessageContent[];
};

export type SystemMessage = {
  role: ChatRole.SYSTEM;
  content: string;
};

export type ChatMessage = UserMessage | AssistantMessage | SystemMessage;
