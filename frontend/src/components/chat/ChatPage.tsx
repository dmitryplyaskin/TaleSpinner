import React from 'react';
import { Box, Container } from '@mui/material';
import { goToWelcome, goToWorldPreparation } from '../../model/app-navigation';
import { useChat } from './hooks/useChat';
import { ChatHeader } from './components/ChatHeader';
import { MessagesList } from './components/MessagesList';
import { ChatInput } from './components/ChatInput';
import { MainLayout, Sidebar, RightPanel } from '../layout';
import { useUnit } from 'effector-react';
import { $selectedWorld } from '@model/game-sessions';

export const ChatPage: React.FC = () => {
	const { messages, isTyping, inputValue, setInputValue, sendMessage } = useChat();
	const currentWorld = useUnit($selectedWorld);

	const handleBack = () => {
		goToWelcome();
	};
	
	const handleSelectWorld = (worldId: string) => {
		goToWorldPreparation(worldId);
	};

	return (
		<MainLayout
			sidebar={<Sidebar currentWorldId={currentWorld?.id} onSelectWorld={handleSelectWorld} />}
			rightPanel={<RightPanel worldName={currentWorld?.name} worldDescription={currentWorld?.description} />}
			showSidebar={true}
			showRightPanel={true}
		>
			<Box 
				sx={{ 
					height: '100%', 
					display: 'flex', 
					flexDirection: 'column',
					position: 'relative',
					backgroundImage: 'url(/assets/images/chat-bg-placeholder.jpg)', // Placeholder for background
					backgroundSize: 'cover',
					backgroundPosition: 'center',
				}}
			>
				{/* Overlay для улучшения читаемости на фоне */}
				<Box 
					sx={{ 
						position: 'absolute', 
						top: 0, 
						left: 0, 
						right: 0, 
						bottom: 0, 
						background: 'rgba(0,0,0,0.6)',
						backdropFilter: 'blur(5px)',
						zIndex: 0
					}} 
				/>

				<Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
					<Container maxWidth="lg" sx={{ py: 2, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
						<ChatHeader onBack={handleBack} />

						<Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', mt: 2, pr: 1 }} className="custom-scrollbar">
							<MessagesList messages={messages} isTyping={isTyping} />
						</Box>
					</Container>

					{/* Поле ввода */}
					<Box
						sx={{
							backgroundColor: 'rgba(15, 15, 15, 0.8)',
							backdropFilter: 'blur(20px)',
							borderTop: '1px solid rgba(255, 255, 255, 0.1)',
							py: 3,
							px: 2,
						}}
					>
						<Container maxWidth="lg">
							<ChatInput value={inputValue} onChange={setInputValue} onSend={sendMessage} disabled={isTyping} />
						</Container>
					</Box>
				</Box>
			</Box>
		</MainLayout>
	);
};
