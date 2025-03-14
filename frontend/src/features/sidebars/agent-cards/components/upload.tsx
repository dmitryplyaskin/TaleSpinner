import { FileUploadTrigger } from '@ui/chakra-core-ui/file-upload';

import { FileUploadFileAcceptDetails, FileUploadRootProvider, useFileUpload } from '@chakra-ui/react';
import { uploadAgentCardFilesFx } from '@model/files';
import { FileUploadRoot } from '@ui/chakra-core-ui/file-upload';

import { LuUpload } from 'react-icons/lu';
import { toaster } from '@ui/chakra-core-ui/toaster';
import { IconButtonWithTooltip } from '@ui/icon-button-with-tooltip';

export const Upload = () => {
	const fileUpload = useFileUpload({
		maxFiles: 10,
		maxFileSize: 10000,
	});

	const handleFileChange = async (details: FileUploadFileAcceptDetails) => {
		if (!details.files?.length) return;

		try {
			uploadAgentCardFilesFx(Array.from(details.files));
		} catch (error) {
			toaster.error({ title: 'Не удалось загрузить файлы' });
		}

		fileUpload.clearFiles();
	};

	return (
		<FileUploadRootProvider value={fileUpload}>
			<FileUploadRoot
				maxFiles={10}
				onFileAccept={handleFileChange}
				accept={{
					'image/png': ['.png'],
					'application/json': ['.json'],
				}}
			>
				<FileUploadTrigger>
					<IconButtonWithTooltip icon={<LuUpload />} tooltip="Импорт" aria-label="Импорт" variant="ghost" />
				</FileUploadTrigger>
			</FileUploadRoot>
		</FileUploadRootProvider>
	);
};
