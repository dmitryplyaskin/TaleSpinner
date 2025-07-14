export type World = {
  id: string;
  name: string;
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
  characters: Character[];
  chats: Chats[];
};

export type Character = {
  id: string;
  name: string;
  description: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Chats = {
  id: string;
  worldId: string;
  messages: Message[];
};

type Message = {
  id: string;
  chatId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};
