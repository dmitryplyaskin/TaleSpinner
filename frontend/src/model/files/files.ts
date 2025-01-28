import { createEffect, createEvent, createStore, sample } from 'effector';
import { apiRoutes } from '../../api-routes';
import { asyncHandler } from '../utils/async-handler';
import { UploadedFile, UploadResponse } from './types';

export const $uploadedFiles = createStore<UploadedFile[]>([]);

export const uploadFiles = createEvent<File[]>();
export const deleteFile = createEvent<string>();

export const uploadFilesFx = createEffect<File[], UploadResponse>(async (files) =>
	asyncHandler(async () => {
		const formData = new FormData();
		files.forEach((file) => {
			formData.append('files', file);
		});

		const response = await fetch(apiRoutes.files.upload(), {
			method: 'POST',
			body: formData,
		});
		return response.json();
	}, 'Error uploading files'),
);

export const deleteFileFx = createEffect<string, void>((filename) =>
	asyncHandler(async () => {
		await fetch(apiRoutes.files.delete(filename), {
			method: 'DELETE',
		});
	}, 'Error deleting file'),
);

export const getFileMetadataFx = createEffect<string, any>((filename) =>
	asyncHandler(async () => {
		const response = await fetch(apiRoutes.files.metadata(filename));
		return response.json();
	}, 'Error getting file metadata'),
);

$uploadedFiles
	.on(uploadFilesFx.doneData, (_, { files }) => files)
	.on(deleteFileFx.done, (state, { params: filename }) => state.filter((file) => file.filename !== filename));

sample({
	clock: uploadFiles,
	target: uploadFilesFx,
});

sample({
	clock: deleteFile,
	target: deleteFileFx,
});
