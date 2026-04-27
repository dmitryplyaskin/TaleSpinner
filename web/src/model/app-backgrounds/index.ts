import { combine, createEffect, createEvent, createStore, sample } from "effector";

import {
  deleteAppBackground,
  importAppBackground,
  listAppBackgrounds,
  setActiveAppBackground,
  toAbsoluteAppBackgroundUrl,
} from "../../api/app-backgrounds";
import i18n from "../../i18n";
import { toaster } from "../../ui/toaster";

import { resolveActiveAppBackground } from "./helpers";

import type {
  AppBackgroundActiveSelection,
  AppBackgroundAsset,
  AppBackgroundCatalog,
} from "@shared/types/app-background";

export const loadAppBackgroundCatalogFx = createEffect(async (): Promise<AppBackgroundCatalog> => {
  return listAppBackgrounds();
});

export const importAppBackgroundFx = createEffect(async (file: File): Promise<AppBackgroundAsset> => {
  return importAppBackground(file);
});

export const setActiveAppBackgroundFx = createEffect(
  async (activeBackgroundId: string | null): Promise<AppBackgroundActiveSelection> => {
    return setActiveAppBackground(activeBackgroundId);
  }
);

export const deleteAppBackgroundFx = createEffect(
  async (id: string): Promise<AppBackgroundActiveSelection & { deletedId: string }> => {
    return deleteAppBackground(id);
  }
);

export const appBackgroundsReloadRequested = createEvent();

export const $appBackgroundCatalog = createStore<AppBackgroundCatalog>({
  items: [],
  activeBackgroundId: null,
})
  .on(loadAppBackgroundCatalogFx.doneData, (_, catalog) => catalog)
  .on(setActiveAppBackgroundFx.doneData, (state, selection) => ({
    ...state,
    activeBackgroundId: selection.activeBackgroundId,
  }))
  .on(deleteAppBackgroundFx.doneData, (state, payload) => ({
    items: state.items.filter((item) => item.id !== payload.deletedId),
    activeBackgroundId: payload.activeBackgroundId,
  }));

export const $appBackgroundItems = $appBackgroundCatalog.map((catalog) => catalog.items);
export const $activeAppBackgroundId = $appBackgroundCatalog.map((catalog) => catalog.activeBackgroundId);
export const $appBackgroundCatalogError = createStore<string | null>(null)
  .on(loadAppBackgroundCatalogFx.failData, (_, error) => (error instanceof Error ? error.message : String(error)))
  .reset(loadAppBackgroundCatalogFx.done, appBackgroundsReloadRequested);

export const $activeAppBackground = combine(
  $appBackgroundItems,
  $activeAppBackgroundId,
  (items, activeBackgroundId) => resolveActiveAppBackground(items, activeBackgroundId)
);

export const $activeAppBackgroundUrl = $activeAppBackground.map((item) =>
  item ? toAbsoluteAppBackgroundUrl(item.imageUrl) : null
);

sample({
  clock: appBackgroundsReloadRequested,
  target: loadAppBackgroundCatalogFx,
});

sample({
  clock: [importAppBackgroundFx.doneData, deleteAppBackgroundFx.doneData],
  target: loadAppBackgroundCatalogFx,
});

importAppBackgroundFx.doneData.watch((background) => {
  toaster.success({
    title: i18n.t("appSettings.backgrounds.toasts.importDone"),
    description: background.name,
  });
});
importAppBackgroundFx.failData.watch((error) => {
  toaster.error({
    title: i18n.t("appSettings.backgrounds.toasts.importFailed"),
    description: error instanceof Error ? error.message : String(error),
  });
});
setActiveAppBackgroundFx.failData.watch((error) => {
  toaster.error({
    title: i18n.t("appSettings.backgrounds.toasts.selectFailed"),
    description: error instanceof Error ? error.message : String(error),
  });
});
deleteAppBackgroundFx.doneData.watch(() => {
  toaster.success({
    title: i18n.t("appSettings.backgrounds.toasts.deleteDone"),
  });
});
deleteAppBackgroundFx.failData.watch((error) => {
  toaster.error({
    title: i18n.t("appSettings.backgrounds.toasts.deleteFailed"),
    description: error instanceof Error ? error.message : String(error),
  });
});
