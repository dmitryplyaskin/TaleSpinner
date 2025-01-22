import React from 'react';

import { Flex } from '@chakra-ui/react';

import { useUnit } from 'effector-react';
import { $chatList } from '@model/chat-list';
import { CharacterCard } from './chat-card';
import { Drawer } from '@ui/drawer';
import { EditChatModal } from './edit-chat-modal';

export const ChatCardSidebar: React.FC = () => {
	const list = useUnit($chatList);

	return (
		<>
			<Drawer name="chatCards" title="Chat cards">
				<Flex direction="column" gap="4">
					{list.map((chat) => (
						<CharacterCard key={chat.id} data={chat} />
					))}
				</Flex>
			</Drawer>
			<EditChatModal />
		</>
	);
};
