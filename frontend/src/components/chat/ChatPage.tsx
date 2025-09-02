import React from 'react';
import { Container, Divider } from '@mui/material';
import { goToWelcome } from '../../model/app-navigation';
import { useChat } from './hooks/useChat';
import { ChatHeader } from './components/ChatHeader';
import { MessagesList } from './components/MessagesList';
import { ChatInput } from './components/ChatInput';

export const ChatPage: React.FC = () => {
	const { messages, isTyping, inputValue, setInputValue, sendMessage } = useChat();

	const handleBack = () => {
		goToWelcome();
	};

	return (
		<Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 2 }}>
			<ChatHeader onBack={handleBack} />

			<MessagesList messages={messages} isTyping={isTyping} />

			<Divider sx={{ mb: 2 }} />

			<ChatInput value={inputValue} onChange={setInputValue} onSend={sendMessage} disabled={isTyping} />
		</Container>
	);
};
