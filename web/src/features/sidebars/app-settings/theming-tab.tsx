import { Button, FileButton, Group, Select, SegmentedControl, Stack, Text, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import {
  DEFAULT_UI_THEME_PAYLOAD,
  UI_THEME_BUILT_IN_IDS,
} from "@shared/types/ui-theme";
import { useUnit } from "effector-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  $activeUiThemePreset,
  $uiThemePresets,
  $uiThemeSettings,
  createUiThemePresetFx,
  deleteUiThemePresetFx,
  patchUiThemeSettingsFx,
  updateUiThemePresetFx,
} from "@model/ui-themes";
import { toaster } from "@ui/toaster";

import { downloadBlobFile, exportBundle, importBundle } from "../../../api/bundles";
import { resolveBundleAutoApplyTargets } from "../common/bundle-helpers";

import { ThemePresetEditor } from "./theme-preset-editor";

import type { UiThemePresetDto } from "../../../api/ui-theme";

type ColorSchemeValue = "light" | "dark" | "auto";

function resolveNextPresetName(baseName: string, usedNames: Set<string>): string {
  const trimmed = baseName.trim();
  if (!usedNames.has(trimmed)) return trimmed;
  for (let idx = 2; idx <= 9999; idx += 1) {
    const candidate = `${trimmed} ${idx}`;
    if (!usedNames.has(candidate)) return candidate;
  }
  return `${trimmed} ${Date.now()}`;
}

export const ThemingTab = () => {
  const { t } = useTranslation();
  const [presets, settings, activePreset] = useUnit([
    $uiThemePresets,
    $uiThemeSettings,
    $activeUiThemePreset,
  ]);
  const [draftPreset, setDraftPreset] = useState<UiThemePresetDto | null>(null);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");
  const selectedColorScheme: ColorSchemeValue =
    settings?.colorScheme ?? (colorScheme === "auto" ? computedColorScheme : colorScheme);
  const presetOptions = useMemo(() => presets.map((x) => ({ value: x.presetId, label: x.name })), [presets]);
  const selectedPresetId = settings?.activePresetId ?? activePreset?.presetId ?? null;
  const activePresetRef = useRef(activePreset);

  useEffect(() => {
    activePresetRef.current = activePreset;
  }, [activePreset]);

  useEffect(() => {
    setDraftPreset(activePresetRef.current ? structuredClone(activePresetRef.current) : null);
  }, [activePreset?.presetId, activePreset?.version]);

  const handleApplyColorScheme = (value: string) => {
    const next = value as ColorSchemeValue;
    if (settings?.colorScheme === next) return;
    setColorScheme(next);
    void patchUiThemeSettingsFx({ colorScheme: next });
  };

  const handleSelectPreset = (presetId: string | null) => {
    if (!presetId) return;
    if (settings?.activePresetId === presetId) return;
    void patchUiThemeSettingsFx({ activePresetId: presetId });
  };

  const handleCreateNewPreset = () => {
    const usedNames = new Set(presets.map((item) => item.name));
    const nextName = resolveNextPresetName(t("appSettings.theming.defaults.newPresetName"), usedNames);

    const defaultPresetPayload =
      presets.find((item) => item.presetId === UI_THEME_BUILT_IN_IDS.default)?.payload ?? DEFAULT_UI_THEME_PAYLOAD;

    void createUiThemePresetFx({
      name: nextName,
      payload: structuredClone(defaultPresetPayload),
    }).then((created) => {
      void patchUiThemeSettingsFx({ activePresetId: created.presetId });
    });
  };

  const handleCreatePresetCopy = () => {
    const source = draftPreset ?? activePreset;
    if (!source) return;

    const usedNames = new Set(presets.map((item) => item.name));
    const nextName = resolveNextPresetName(`${source.name} (copy)`, usedNames);

    void createUiThemePresetFx({
      name: nextName,
      description: source.description,
      payload: structuredClone(source.payload),
    }).then((created) => {
      void patchUiThemeSettingsFx({ activePresetId: created.presetId });
    });
  };

  const handleSavePreset = () => {
    if (!draftPreset || draftPreset.builtIn) return;
    void updateUiThemePresetFx({
      presetId: draftPreset.presetId,
      name: draftPreset.name,
      description: draftPreset.description ?? null,
      payload: draftPreset.payload,
    });
  };

  const handleDeletePreset = () => {
    if (!draftPreset || draftPreset.builtIn) return;
    if (!window.confirm(t("appSettings.theming.confirm.deletePreset"))) return;
    void deleteUiThemePresetFx(draftPreset.presetId);
  };

  const handleExportPreset = async () => {
    if (!draftPreset) return;
    try {
      const exported = await exportBundle({
        source: { kind: "ui_theme_preset", id: draftPreset.presetId },
        selections: [{ kind: "ui_theme_preset", id: draftPreset.presetId }],
        format: "auto",
      });
      downloadBlobFile(exported.filename, exported.blob);
    } catch (error) {
      toaster.error({
        title: t("appSettings.theming.toasts.exportFailed"),
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleImportPreset = async (file: File | null) => {
    if (!file) return;
    try {
      const imported = await importBundle(file);
      const applyTargets = resolveBundleAutoApplyTargets(imported);
      if (applyTargets.uiThemePresetId) {
        await patchUiThemeSettingsFx({ activePresetId: applyTargets.uiThemePresetId });
      }
      if (applyTargets.warnings.length > 0) {
        toaster.warning({
          title: t("appSettings.theming.toasts.importDone"),
          description: applyTargets.warnings.join(" "),
        });
      }
      toaster.success({
        title: t("appSettings.theming.toasts.importDone"),
        description: t("appSettings.theming.toasts.importedCount", {
          count: imported.created.uiThemePresets.length,
        }),
      });
    } catch (error) {
      toaster.error({
        title: t("appSettings.theming.toasts.importFailed"),
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <Stack gap="md">
      <Text size="sm" fw={600}>
        {t("appSettings.theming.mode")}
      </Text>
      <SegmentedControl
        fullWidth
        value={selectedColorScheme}
        onChange={handleApplyColorScheme}
        data={[
          { label: t("appSettings.theming.light"), value: "light" },
          { label: t("appSettings.theming.dark"), value: "dark" },
          { label: t("appSettings.theming.auto"), value: "auto" },
        ]}
      />

      <Select
        label={t("appSettings.theming.activePreset")}
        data={presetOptions}
        value={selectedPresetId}
        onChange={handleSelectPreset}
        allowDeselect={false}
        comboboxProps={{ withinPortal: false }}
      />

      <Group gap="xs">
        <Button size="xs" variant="light" onClick={handleCreateNewPreset}>
          {t("appSettings.theming.actions.createNew")}
        </Button>
        <Button size="xs" variant="light" onClick={handleCreatePresetCopy} disabled={!activePreset}>
          {t("appSettings.theming.actions.createCopy")}
        </Button>
        <FileButton onChange={handleImportPreset} accept=".json">
          {(props) => (
            <Button {...props} size="xs" variant="default">
              {t("appSettings.theming.actions.import")}
            </Button>
          )}
        </FileButton>
        <Button size="xs" variant="default" onClick={handleExportPreset} disabled={!draftPreset}>
          {t("appSettings.theming.actions.export")}
        </Button>
        <Button
          size="xs"
          color="red"
          variant="light"
          onClick={handleDeletePreset}
          disabled={!draftPreset || Boolean(draftPreset?.builtIn)}
        >
          {t("appSettings.theming.actions.delete")}
        </Button>
      </Group>

      {draftPreset ? (
        <ThemePresetEditor draftPreset={draftPreset} onChange={setDraftPreset} onSave={handleSavePreset} />
      ) : null}
    </Stack>
  );
};
