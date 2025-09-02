import { useState, useCallback } from 'react';
import { ChatMessage, ChatState } from '../types';
import { mockMessages } from '../data/mockData';

export const useChat = (initialMessages: ChatMessage[] = mockMessages) => {
	const [state, setState] = useState<ChatState>({
		messages: initialMessages,
		isTyping: false,
		inputValue: '',
	});

	const setInputValue = useCallback((value: string) => {
		setState((prev) => ({ ...prev, inputValue: value }));
	}, []);

	const addMessage = useCallback((message: ChatMessage) => {
		setState((prev) => ({
			...prev,
			messages: [...prev.messages, message],
		}));
	}, []);

	const setIsTyping = useCallback((isTyping: boolean) => {
		setState((prev) => ({ ...prev, isTyping }));
	}, []);

	const sendMessage = useCallback(() => {
		if (!state.inputValue.trim()) return;

		const newMessage: ChatMessage = {
			id: Date.now().toString(),
			type: 'user',
			content: state.inputValue.trim(),
			timestamp: new Date(),
			username: 'Игрок',
		};

		addMessage(newMessage);
		setInputValue('');
		setIsTyping(true);

		// Имитация ответа ИИ
		setTimeout(() => {
			const aiResponse: ChatMessage = {
				id: (Date.now() + 1).toString(),
				type: 'ai',
				content: 'Интересно! Расскажите мне больше об этом. Я обдумываю различные варианты развития истории...',
				timestamp: new Date(),
				username: 'ИИ Мастер',
			};
			addMessage(aiResponse);
			setIsTyping(false);
		}, 2000);
	}, [state.inputValue, addMessage, setInputValue, setIsTyping]);

	const clearMessages = useCallback(() => {
		setState((prev) => ({ ...prev, messages: [] }));
	}, []);

	const resetChat = useCallback(() => {
		setState({
			messages: initialMessages,
			isTyping: false,
			inputValue: '',
		});
	}, [initialMessages]);

	return {
		messages: state.messages,
		isTyping: state.isTyping,
		inputValue: state.inputValue,
		setInputValue,
		sendMessage,
		addMessage,
		clearMessages,
		resetChat,
		setIsTyping,
	};
};
