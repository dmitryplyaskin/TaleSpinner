import React, { useRef, useEffect } from 'react';
import { Paper, Stack } from '@mui/material';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatMessage } from '../types';

interface MessagesListProps {
	messages: ChatMessage[];
	isTyping?: boolean;
	autoScroll?: boolean;
}

export const MessagesList: React.FC<MessagesListProps> = ({ messages, isTyping = false, autoScroll = true }) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Автопрокрутка к последнему сообщению
	useEffect(() => {
		if (autoScroll) {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages, isTyping, autoScroll]);

	return (
		<Paper
			elevation={2}
			sx={{
				flexGrow: 1,
				overflow: 'auto',
				p: 3,
				mb: 2,
				background: 'linear-gradient(135deg, #1a1618 0%, #1f1b1d 100%)',
				border: '1px solid rgba(212, 175, 55, 0.15)',
			}}
		>
			<Stack spacing={1}>
				{messages.map((message) => (
					<MessageBubble key={message.id} message={message} />
				))}

				{isTyping && <TypingIndicator />}

				<div ref={messagesEndRef} />
			</Stack>
		</Paper>
	);
};
