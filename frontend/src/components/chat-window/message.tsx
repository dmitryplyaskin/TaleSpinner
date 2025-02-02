import { Box, Flex, Text, Textarea } from '@chakra-ui/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LuPen, LuCheck, LuX, LuTrash } from 'react-icons/lu';

import { IconButtonWithTooltip } from '@ui/icon-button-with-tooltip';
import { Avatar } from '@ui/chakra-core-ui/avatar';
import { useMemo, useState } from 'react';
import { deleteMessage, updateSwipe } from '@model/chat-service';
import { InteractionMessage } from '@shared/types/agent-card';

type MessageProps = {
	data: InteractionMessage;
};

export const Message: React.FC<MessageProps> = ({ data }) => {
	const selectedSwipe = useMemo(() => data.swipes.find((swipe) => swipe.id === data.activeSwipeId), [data]);
	const answer = useMemo(
		() => selectedSwipe?.components.find((component) => component.type === 'answer'),
		[selectedSwipe],
	);

	const answerContent = answer?.content || '';

	const [content, setContent] = useState(answerContent);
	const [isEditing, setIsEditing] = useState(false);

	const handleOpenEdit = () => {
		setContent(answerContent);
		setIsEditing(true);
	};

	const handleDelete = () => {
		deleteMessage(data.id);
	};

	const handleConfirmEdit = () => {
		updateSwipe({
			messageId: data.id,
			swipeId: selectedSwipe?.id!,
			componentId: answer?.id!,
			content,
		});
		setIsEditing(false);
	};

	const handleCancelEdit = () => {
		setContent(answerContent);
		setIsEditing(false);
	};

	const isUser = data.role === 'user';

	return (
		<Flex justify={isUser ? 'flex-end' : 'flex-start'} gap={2}>
			{!isUser && <Avatar size="lg" name="AI Assistant" src="/ai-avatar.png" bg="purple.500" />}
			<Box
				position="relative"
				maxW={isUser ? '70%' : 'full'}
				w={isEditing ? 'full' : 'auto'}
				p={4}
				borderRadius="lg"
				bg={isUser ? 'purple.50' : 'white'}
				borderWidth={1}
				borderColor={isUser ? 'purple.400' : 'gray.200'}
				wordBreak="break-word"
				mr={isUser ? 0 : '50px'}
			>
				<Flex align="center">
					<Text fontSize="sm" fontWeight="semibold" color={isUser ? 'purple.600' : 'gray.800'}>
						{isUser ? 'You' : 'AI Assistant'}
					</Text>
					<Box ml="auto" gap={2}>
						{isEditing ? (
							<Flex gap={1}>
								<IconButtonWithTooltip
									size="xs"
									variant="solid"
									colorPalette="red"
									icon={<LuX />}
									tooltip="Cancel edit"
									aria-label="Cancel edit"
									onClick={handleCancelEdit}
								/>
								<IconButtonWithTooltip
									size="xs"
									variant="solid"
									colorPalette="green"
									icon={<LuCheck />}
									tooltip="Confirm edit"
									aria-label="Confirm edit"
									onClick={handleConfirmEdit}
								/>
							</Flex>
						) : (
							<Flex gap={1}>
								<IconButtonWithTooltip
									size="xs"
									variant="ghost"
									colorPalette="purple"
									icon={<LuPen />}
									tooltip="Edit message"
									aria-label="Edit message"
									onClick={handleOpenEdit}
								/>
								<IconButtonWithTooltip
									size="xs"
									variant="ghost"
									colorPalette="red"
									icon={<LuTrash />}
									tooltip="Delete message"
									aria-label="Delete message"
									onClick={handleDelete}
								/>
							</Flex>
						)}
					</Box>
				</Flex>
				<Box mt={2} w={'100%'}>
					{isEditing ? (
						<Textarea w={'100%'} autoresize value={content} onChange={(e) => setContent(e.target.value)} />
					) : (
						<Markdown remarkPlugins={[remarkGfm]}>{answerContent}</Markdown>
					)}
				</Box>
				<Text fontSize="xs" opacity={0.7} mt={1}>
					{new Date(data.timestamp).toLocaleTimeString()}
				</Text>
			</Box>
			{isUser && <Avatar size="lg" name="User" src="/user-avatar.png" bg="purple.500" />}
		</Flex>
	);
};
