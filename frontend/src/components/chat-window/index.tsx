import React, { useState, useRef } from 'react';
import { streamMessage } from '../api';
import { RenderChat } from './render-chat';
import { v4 as uuidv4 } from 'uuid';
import { $currentChatFormatted, addUserMessage, updateUserMessageContent } from '../../model';

import { Flex, Box, Button, Container, Textarea } from '@chakra-ui/react';
import { ChatMessage, Message } from '@types/chat';

interface ChatWindowProps {
	llmSettings: {
		temperature: number;
		maxTokens: number;
		topP: number;
		frequencyPenalty: number;
		presencePenalty: number;
	};
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ llmSettings }) => {
	const [text, setText] = useState('');
	const [isStreaming, setIsStreaming] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setText(event.target.value);
	};

	const handleSendMessage = async () => {
		if (text.trim() === '' || isStreaming) return;

		const chat = $currentChatFormatted.getState();

		const chatHistoryId = chat?.activeChatHistoryId || (chat?.chatHistories[0]?.id as string);
		const messagesList = chat?.chatHistories.find(
			(chatHistory) => chatHistory.id === chat?.activeChatHistoryId,
		)?.messages;

		if (messagesList) {
			const msgId = uuidv4();
			const newMessage = {
				id: uuidv4(),
				content: [{ id: msgId, content: text, timestamp: new Date().toISOString() }],
				currentContentId: msgId,
				role: 'user',
				type: 'default',
				timestamp: new Date().toISOString(),
			} as ChatMessage;

			addUserMessage({ message: newMessage, chatHistoryId });
			messagesList.push(newMessage);
		}

		setText('');
		setIsStreaming(true);

		try {
			const botChatMessageId = uuidv4();
			const botMessageId = uuidv4();
			const newBotMessage = {
				id: botChatMessageId,
				content: [{ id: botMessageId, content: '', timestamp: new Date().toISOString() }],
				role: 'assistant',
				type: 'default',
				timestamp: new Date().toISOString(),
			} as ChatMessage;

			addUserMessage({ message: newBotMessage, chatHistoryId });

			const messages =
				messagesList?.map((x) => ({
					role: x.role,
					content: x.content[0].content,
					timestamp: x.timestamp,
				})) || [];

			const messageStream = streamMessage({
				messages,
				settings: llmSettings,
			});

			let isFirstChunk = true;

			for await (const chunk of messageStream) {
				if ('error' in chunk) {
					break;
				}

				if (isFirstChunk) {
					isFirstChunk = false;
				}
				newBotMessage.content[0] = {
					...newBotMessage.content[0],
					content: newBotMessage.content[0].content + chunk.content,
				} as Message;

				updateUserMessageContent({
					messageId: newBotMessage.id,
					historyId: chatHistoryId,
					content: newBotMessage.content[0].content,
					contentId: newBotMessage.content[0].id,
				});
			}
		} catch (error) {
			console.error('Error:', error);
		} finally {
			setIsStreaming(false);
		}
	};

	const handleKeyPress = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSendMessage();
		}
	};

	// const scrollToBottom = () => {
	// 	messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	// };

	// useEffect(scrollToBottom, [messages]);

	return (
		<Flex direction="column" h="full">
			<Box flex="1" overflowY="auto" bg="gray.100">
				<Container maxW="6xl" p={4}>
					<RenderChat />
					<div ref={messagesEndRef} />
				</Container>
			</Box>

			<Box p={4} bg="white" borderTop="1px" borderColor="gray.200" shadow="md">
				<Container maxW="6xl">
					<Flex gap={4}>
						<Textarea
							value={text}
							onChange={handleInputChange}
							onKeyPress={handleKeyPress}
							placeholder="Введите сообщение..."
							autoresize
							disabled={isStreaming}
							flex="1"
							size={'lg'}
							borderRadius="lg"
							resize={'vertical'}
						/>
						<Button
							onClick={handleSendMessage}
							disabled={isStreaming || !text.trim()}
							colorScheme={isStreaming || !text.trim() ? 'gray' : 'blue'}
							whiteSpace="nowrap"
						>
							{isStreaming ? 'Отправка...' : 'Отправить'}
						</Button>
					</Flex>
				</Container>
			</Box>
		</Flex>
	);
};
