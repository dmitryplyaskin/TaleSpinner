import { Paper, Stack, Text } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useTranslation } from 'react-i18next';

import { toggleSidebarOpen } from '@model/sidebars';
import {
	$worldInfoBooks,
	$worldInfoPersonaBookByPersonaId,
	setWorldInfoBookBoundToPersonaFx,
	setWorldInfoBookBoundToPersonaRequested,
	worldInfoEditorOpenRequested,
} from '@model/world-info';

import { WorldInfoBindingSection } from '../world-info/world-info-binding-section';

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

	return (
		<Paper withBorder p="md" radius="md">
			<Stack gap="sm">
				<Text fw={600}>{t('userPersons.worldInfo.title')}</Text>
				<WorldInfoBindingSection
					books={books}
					selectedBookId={selectedBookId}
					noneLabel={t('userPersons.worldInfo.none')}
					bindingLabel={t('userPersons.worldInfo.bindingLabel')}
					notBoundText={t('userPersons.worldInfo.notBound')}
					openEditorLabel={t('userPersons.worldInfo.openEditor')}
					nothingFoundMessage={t('userPersons.worldInfo.nothingFound')}
					disabled={bindingPending}
					onBindingChange={(bookId) =>
						bindBookToPersona({
							personaId,
							bookId,
						})
					}
					onOpenEditor={() => {
						toggleSidebarOpen({ name: 'worldInfo', isOpen: true });
						worldInfoEditorOpenRequested({ bookId: selectedBookId });
					}}
				/>
			</Stack>
		</Paper>
	);
};
