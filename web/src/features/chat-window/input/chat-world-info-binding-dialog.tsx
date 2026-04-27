import { Button, Select, Stack, Text } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { toggleSidebarOpen } from '@model/sidebars';
import {
	$worldInfoBooks,
	$worldInfoCurrentChatBookId,
	setWorldInfoBookBoundToCurrentChatFx,
	setWorldInfoBookBoundToCurrentChatRequested,
	worldInfoEditorOpenRequested,
} from '@model/world-info';
import { Dialog } from '@ui/dialog';

import {
	buildChatWorldInfoBindingOptions,
	createChatWorldInfoBindingSelectProps,
} from './chat-world-info-binding-dialog.model';

type Props = {
	opened: boolean;
	onOpenChange: (open: boolean) => void;
	chatId: string | null;
	chatTitle: string | null;
};

export const ChatWorldInfoBindingDialog = ({ opened, onOpenChange, chatId, chatTitle }: Props) => {
	const { t } = useTranslation();
	const [books, currentBookId, bindingPending, bindBookToCurrentChat] = useUnit([
		$worldInfoBooks,
		$worldInfoCurrentChatBookId,
		setWorldInfoBookBoundToCurrentChatFx.pending,
		setWorldInfoBookBoundToCurrentChatRequested,
	]);

	const options = useMemo(
		() =>
			buildChatWorldInfoBindingOptions({
				noneLabel: t('chat.management.worldInfoBindingNone'),
				books,
			}),
		[books, t],
	);
	const currentBook = useMemo(
		() => books.find((book) => book.id === currentBookId) ?? null,
		[books, currentBookId],
	);
	const selectProps = useMemo(
		() => createChatWorldInfoBindingSelectProps(t('chat.management.worldInfoBindingNothingFound')),
		[t],
	);

	return (
		<Dialog
			open={opened}
			onOpenChange={onOpenChange}
			title={t('chat.management.worldInfoBindingTitle')}
			size="lg"
			footer={<></>}
		>
			<Stack gap="sm">
				<Text size="sm" c="dimmed">
					{chatTitle
						? t('chat.management.worldInfoBindingForChat', { name: chatTitle })
						: t('chat.management.selectChatFirst')}
				</Text>
				<Select
					label={t('chat.management.worldInfoBindingLabel')}
					value={currentBookId ?? '__none__'}
					data={options}
					disabled={!chatId || bindingPending}
					{...selectProps}
					onChange={(value) => {
						if (!chatId) return;
						bindBookToCurrentChat({
							chatId,
							bookId: value === '__none__' ? null : value ?? null,
						});
					}}
				/>
				{currentBook ? (
					<Stack gap={4}>
						<Text size="sm" fw={600}>
							{currentBook.name}
						</Text>
						<Text size="xs" c="dimmed">
							slug: {currentBook.slug}
						</Text>
					</Stack>
				) : (
					<Text size="sm" c="dimmed">
						{t('chat.management.worldInfoBindingNotBound')}
					</Text>
				)}
				<Button
					type="button"
					variant="light"
					onClick={() => {
						toggleSidebarOpen({ name: 'worldInfo', isOpen: true });
						worldInfoEditorOpenRequested({ bookId: currentBookId });
					}}
				>
					{t('chat.management.worldInfoOpenSidebar')}
				</Button>
			</Stack>
		</Dialog>
	);
};
