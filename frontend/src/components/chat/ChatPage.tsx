import React from 'react';
import { Box, Container, Divider } from '@mui/material';
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
		<Box sx={{ minHeight: '100vh', position: 'relative', pb: '180px' }}>
			<Container maxWidth="lg" sx={{ py: 2 }}>
				<ChatHeader onBack={handleBack} />

				<MessagesList messages={messages} isTyping={isTyping} />
			</Container>

			{/* Закрепленное поле ввода */}
			<Box
				sx={{
					position: 'fixed',
					bottom: 0,
					left: 0,
					right: 0,
					backgroundColor: 'background.default',
					borderTop: '1px solid',
					borderColor: 'divider',
					zIndex: 1000,
					py: 2,
				}}
			>
				<Container maxWidth="lg">
					<Divider sx={{ mb: 2 }} />
					<ChatInput value={inputValue} onChange={setInputValue} onSend={sendMessage} disabled={isTyping} />
				</Container>
			</Box>
		</Box>
	);
};
