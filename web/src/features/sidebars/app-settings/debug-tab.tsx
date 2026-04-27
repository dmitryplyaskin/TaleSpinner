import { Box, Button, Checkbox, Group, Stack, Text } from "@mantine/core";
import { useUnit } from "effector-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { $appDebugEnabled, setAppDebugEnabled } from "@model/app-debug";
import {
  $chatGenerationLogFilters,
  CHAT_GENERATION_LOG_FILTER_DEFINITIONS,
  applyOperationAndSnapshotsLogPreset,
  disableAllChatGenerationLogFilters,
  enableAllChatGenerationLogFilters,
  resetChatGenerationLogFilters,
  setChatGenerationLogFilter,
} from "@model/chat-generation-debug";

export const DebugTab = () => {
  const { t } = useTranslation();
  const [appDebugEnabled, debugLogFilters] = useUnit([$appDebugEnabled, $chatGenerationLogFilters]);

  const debugLogFilterItems = useMemo(
    () =>
      CHAT_GENERATION_LOG_FILTER_DEFINITIONS.map((item) => ({
        ...item,
        label: t(item.labelKey),
        description: t(item.descriptionKey),
      })),
    [t]
  );

  return (
    <Stack gap="md">
      <Checkbox
        checked={appDebugEnabled}
        onChange={(event) => setAppDebugEnabled(event.currentTarget.checked)}
        label={t("appSettings.debug.label")}
      />
      <Text size="xs" c="dimmed">
        {t("appSettings.debug.info")}
      </Text>

      <Box>
        <Text size="sm" fw={600} mb={4}>
          {t("appSettings.debug.logsTitle")}
        </Text>
        <Text size="xs" c="dimmed" mb="xs">
          {t("appSettings.debug.logsInfo")}
        </Text>

        <Group gap="xs" mb="xs">
          <Button size="xs" variant="light" onClick={() => enableAllChatGenerationLogFilters()}>
            {t("appSettings.debug.actions.enableAll")}
          </Button>
          <Button size="xs" variant="light" onClick={() => disableAllChatGenerationLogFilters()}>
            {t("appSettings.debug.actions.disableAll")}
          </Button>
          <Button size="xs" variant="light" onClick={() => applyOperationAndSnapshotsLogPreset()}>
            {t("appSettings.debug.actions.operationsAndSnapshots")}
          </Button>
          <Button size="xs" variant="default" onClick={() => resetChatGenerationLogFilters()}>
            {t("appSettings.debug.actions.resetDefaults")}
          </Button>
        </Group>

        <Stack gap="xs">
          {debugLogFilterItems.map((item) => (
            <Box
              key={item.id}
              p="xs"
              style={{
                border: "1px solid var(--mantine-color-default-border)",
                borderRadius: "var(--mantine-radius-sm)",
              }}
            >
              <Checkbox
                checked={Boolean(debugLogFilters[item.id])}
                onChange={(event) =>
                  setChatGenerationLogFilter({
                    id: item.id,
                    enabled: event.currentTarget.checked,
                  })
                }
                label={item.label}
              />
              <Text size="xs" c="dimmed" mt={4} ml={28}>
                {item.description}
              </Text>
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
};
