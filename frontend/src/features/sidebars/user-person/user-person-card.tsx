import React, { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

import { UserPersonEditor } from './user-person-editor';
import { LuPencil, LuTrash2 } from 'react-icons/lu';
import { userPersonsModel } from '@model/user-persons';
import { IconButtonWithTooltip } from '@ui/icon-button-with-tooltip';
import { UserPersonType } from '@shared/types/user-person';
import { Avatar } from '@ui/chakra-core-ui/avatar';

interface UserPersonCardProps {
	data: UserPersonType;
}

export const UserPersonCard: React.FC<UserPersonCardProps> = ({ data }) => {
	const [isEditing, setIsEditing] = useState(false);

	const handleEdit = () => {
		setIsEditing(true);
	};

	const handleDelete = () => {
		userPersonsModel.deleteItemFx(data.id);
	};

	if (isEditing) {
		return <UserPersonEditor data={data} onClose={() => setIsEditing(false)} />;
	}

	return (
		<Box p="4" borderWidth="1px" borderRadius="lg">
			<Flex justify="space-between" align="center" mb={2}>
				<Flex gap={2} align="center">
					<Avatar size="md" name={data.name} src={`http://localhost:5000${data.avatarUrl}`} />
					<Flex direction="column">
						<Text fontWeight="bold">{data.name}</Text>
						{data.prefix && (
							<Text fontSize="sm" color="gray.600">
								{data.prefix}
							</Text>
						)}
					</Flex>
				</Flex>
				<Flex gap={2}>
					<IconButtonWithTooltip
						tooltip="Редактировать"
						variant="ghost"
						size="sm"
						colorPalette="blue"
						aria-label="Edit"
						onClick={handleEdit}
						icon={<LuPencil />}
					/>
					<IconButtonWithTooltip
						tooltip="Удалить"
						variant="ghost"
						size="sm"
						colorPalette="red"
						aria-label="Delete"
						onClick={handleDelete}
						icon={<LuTrash2 />}
					/>
				</Flex>
			</Flex>
			<Text color="gray.600">{data.type === 'default' ? data.contentTypeDefault : 'Расширенная персона'}</Text>
		</Box>
	);
};
