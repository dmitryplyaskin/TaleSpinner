import { Button, Group, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { ThemePresetAccordion } from "./theme-preset-accordion";

import type { UiThemePresetDto } from "../../../api/ui-theme";

type ThemePresetEditorProps = {
  draftPreset: UiThemePresetDto;
  onChange: (next: UiThemePresetDto) => void;
  onSave: () => void;
};

export const ThemePresetEditor = ({ draftPreset, onChange, onSave }: ThemePresetEditorProps) => {
  const { t } = useTranslation();

  return (
    <Stack gap="sm">
      <TextInput
        label={t("appSettings.theming.presetName")}
        value={draftPreset.name}
        onChange={(event) => onChange({ ...draftPreset, name: event.currentTarget.value })}
        disabled={draftPreset.builtIn}
      />
      <Textarea
        label={t("appSettings.theming.presetDescription")}
        value={draftPreset.description ?? ""}
        onChange={(event) =>
          onChange({
            ...draftPreset,
            description: event.currentTarget.value || undefined,
          })
        }
        autosize
        minRows={2}
        disabled={draftPreset.builtIn}
      />

      {draftPreset.builtIn ? (
        <Text size="xs" c="dimmed">
          {t("appSettings.theming.builtInReadOnly")}
        </Text>
      ) : null}
      <ThemePresetAccordion draftPreset={draftPreset} onChange={onChange} />

      <Group justify="flex-end">
        <Button onClick={onSave} disabled={draftPreset.builtIn}>
          {t("appSettings.theming.actions.save")}
        </Button>
      </Group>
    </Stack>
  );
};
