import { Button, Select, Stack, Text } from '@mantine/core';
import { useMemo } from 'react';

import {
	WORLD_INFO_UNBOUND_OPTION_VALUE,
	buildWorldInfoBindingOptions,
	createWorldInfoBindingSelectProps,
	parseWorldInfoBindingValue,
} from './world-info-binding-section.model';

export type WorldInfoBindingBook = {
	id: string;
	name: string;
	slug: string;
};

type Props = {
	books: WorldInfoBindingBook[];
	selectedBookId: string | null;
	noneLabel: string;
	bindingLabel: string;
	notBoundText: string;
	openEditorLabel: string;
	nothingFoundMessage: string;
	disabled?: boolean;
	onBindingChange: (bookId: string | null) => void;
	onOpenEditor: () => void;
};

function WorldInfoBindingSummary({
	book,
	notBoundText,
}: {
	book: WorldInfoBindingBook | null;
	notBoundText: string;
}) {
	if (!book) {
		return (
			<Text size="sm" c="dimmed">
				{notBoundText}
			</Text>
		);
	}

	return (
		<Stack gap={4}>
			<Text size="sm" fw={600}>
				{book.name}
			</Text>
			<Text size="xs" c="dimmed">
				slug: {book.slug}
			</Text>
		</Stack>
	);
}

export function WorldInfoBindingSection({
	books,
	selectedBookId,
	noneLabel,
	bindingLabel,
	notBoundText,
	openEditorLabel,
	nothingFoundMessage,
	disabled,
	onBindingChange,
	onOpenEditor,
}: Props) {
	const options = useMemo(
		() => buildWorldInfoBindingOptions({ noneLabel, books }),
		[books, noneLabel],
	);
	const selectedBook = useMemo(
		() => books.find((book) => book.id === selectedBookId) ?? null,
		[books, selectedBookId],
	);
	const selectProps = useMemo(
		() => createWorldInfoBindingSelectProps(nothingFoundMessage),
		[nothingFoundMessage],
	);

	return (
		<Stack gap="md">
			<Select
				label={bindingLabel}
				value={selectedBookId ?? WORLD_INFO_UNBOUND_OPTION_VALUE}
				data={options}
				disabled={disabled}
				{...selectProps}
				onChange={(value) => onBindingChange(parseWorldInfoBindingValue(value))}
			/>
			<WorldInfoBindingSummary book={selectedBook} notBoundText={notBoundText} />
			<Button type="button" variant="light" onClick={onOpenEditor}>
				{openEditorLabel}
			</Button>
		</Stack>
	);
}
