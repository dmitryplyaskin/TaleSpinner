import { Button, Paper, Select, Stack, Text } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { toggleSidebarOpen } from '@model/sidebars';
import {
	$worldInfoBooks,
	$worldInfoPersonaBookByPersonaId,
	setWorldInfoBookBoundToPersonaFx,
	setWorldInfoBookBoundToPersonaRequested,
	worldInfoEditorOpenRequested,
} from '@model/world-info';

type Props = {
	personaId: string;
};

export const UserPersonWorldInfoSection = ({ personaId }: Props) => {
	const { t } = useTranslation();
	const [books, bookByPersonaId, bindingPending, bindBookToPersona] = useUnit([
		$worldInfoBooks,
		$worldInfoPersonaBookByPersonaId,
		setWorldInfoBookBoundToPersonaFx.pending,
		setWorldInfoBookBoundToPersonaRequested,
	]);

	const selectedBookId = bookByPersonaId[personaId] ?? null;
	const selectedBook = useMemo(
		() => books.find((book) => book.id === selectedBookId) ?? null,
		[books, selectedBookId],
	);
	const options = useMemo(
		() => [{ value: '__none__', label: t('userPersons.worldInfo.none') }, ...books.map((book) => ({ value: book.id, label: book.name }))],
		[books, t],
	);

	return (
		<Paper withBorder p="md" radius="md">
			<Stack gap="sm">
				<Text fw={600}>{t('userPersons.worldInfo.title')}</Text>
				<Select
					label={t('userPersons.worldInfo.bindingLabel')}
					value={selectedBookId ?? '__none__'}
					data={options}
					disabled={bindingPending}
					comboboxProps={{ withinPortal: false }}
					onChange={(value) =>
						bindBookToPersona({
							personaId,
							bookId: value === '__none__' ? null : value ?? null,
						})
					}
				/>
				{selectedBook ? (
					<Stack gap={4}>
						<Text size="sm" fw={600}>
							{selectedBook.name}
						</Text>
						<Text size="xs" c="dimmed">
							slug: {selectedBook.slug}
						</Text>
					</Stack>
				) : (
					<Text size="sm" c="dimmed">
						{t('userPersons.worldInfo.notBound')}
					</Text>
				)}
				<Button
					type="button"
					variant="light"
					onClick={() => {
						toggleSidebarOpen({ name: 'worldInfo', isOpen: true });
						worldInfoEditorOpenRequested({ bookId: selectedBookId });
					}}
				>
					{t('userPersons.worldInfo.openEditor')}
				</Button>
			</Stack>
		</Paper>
	);
};
