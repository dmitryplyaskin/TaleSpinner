export enum ChatRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export type UserMessage = {
  role: ChatRole.USER;
  content: string;
};

export type AssistantMessage = {
  role: ChatRole.ASSISTANT;
  content: string;
};

export type SystemMessage = {
  role: ChatRole.SYSTEM;
  content: string;
};

export type ChatMessage = UserMessage | AssistantMessage | SystemMessage;

export type FirstMessage = [
  { type: "gm"; content: string } | { type: "character"; content: string }
];
