import { createStore, createEvent } from 'effector';
import { ChatMessage } from '@shared/types/chat';

export const $chat = createStore<ChatMessage[]>([]);

export const addMessage = createEvent<ChatMessage>();

$chat.on(addMessage, (state, message) => [...state, message]);

export const openChat = createEvent();
