import { Stack } from '@chakra-ui/react';
import { ChatCard } from '../../types/chat';
import { Dialog } from '@ui/dialog';
import { FormProvider, useForm } from 'react-hook-form';
import { FormInput, FormTextarea, FormAutocomplete } from '@ui/form-components';

type CharacterCardV2 = {
	name: string;
	description: string;
	personality: string;
	scenario: string;
	first_mes: string;
	mes_example: string;
	creator_notes: string;
	system_prompt: string;
	post_history_instructions: string;
	creator: string;
	character_version: string;
	tags: Array<{ value: string; label: string }>;
};

type Props = {
	isOpen: boolean;
	onClose: () => void;
	chat: ChatCard;
};

export const EditChatModal: React.FC<Props> = ({ isOpen, onClose, chat }) => {
	const form = useForm<CharacterCardV2>({
		defaultValues: {
			name: chat.title || '',
			description: '',
			personality: '',
			scenario: '',
			first_mes: '',
			mes_example: '',
			creator_notes: '',
			system_prompt: '',
			post_history_instructions: '',
			creator: '',
			character_version: '1.0',
			tags: [],
		},
	});

	const handleSubmit = form.handleSubmit(async (data) => {
		// Здесь будет логика сохранения
		onClose();
	});

	if (!isOpen) return null;

	return (
		<FormProvider {...form}>
			<form id="dialog-form" onSubmit={handleSubmit}>
				<Dialog
					isOpen={isOpen}
					onClose={onClose}
					title="Редактировать карточку персонажа"
					size="cover"
					closeOnEscape={false}
					closeOnInteractOutside={false}
				>
					<Stack gap={4}>
						<FormInput name="name" label="Имя персонажа" placeholder="Введите имя персонажа" />
						<FormTextarea
							name="description"
							label="Описание"
							placeholder="Опишите внешность, характер и другие особенности персонажа"
						/>
						<FormTextarea
							name="personality"
							label="Личность"
							placeholder="Опишите черты характера, привычки и поведение персонажа"
						/>
						<FormTextarea
							name="scenario"
							label="Сценарий"
							placeholder="Опишите текущую ситуацию или контекст разговора"
						/>
						<FormTextarea name="first_mes" label="Первое сообщение" placeholder="Первое сообщение от персонажа" />
						<FormTextarea name="mes_example" label="Пример диалога" placeholder="Пример того, как персонаж общается" />
						<FormTextarea
							name="creator_notes"
							label="Заметки создателя"
							placeholder="Важные заметки для пользователей (рекомендации по настройкам, предупреждения и т.д.)"
						/>
						<FormTextarea
							name="system_prompt"
							label="Системная инструкция"
							placeholder="Системные инструкции для модели (опционально)"
						/>
						<FormTextarea
							name="post_history_instructions"
							label="Пост-инструкции"
							placeholder="Инструкции, добавляемые после истории диалога (опционально)"
						/>
						<FormInput name="creator" label="Создатель" placeholder="Ваше имя или псевдоним" />
						<FormInput name="character_version" label="Версия" placeholder="Версия карточки персонажа" />
						<FormAutocomplete
							name="tags"
							label="Теги"
							placeholder="Выберите теги"
							options={[
								{ value: '1', label: '1' },
								{ value: '2', label: '2' },
							]}
							// isMulti={true}
						/>
					</Stack>
				</Dialog>
			</form>
		</FormProvider>
	);
};
