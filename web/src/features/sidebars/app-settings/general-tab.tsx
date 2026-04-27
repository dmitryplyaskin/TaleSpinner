import { Box, Stack, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { FormCheckbox, FormSelect } from "@ui/form-components";

export const GeneralTab = () => {
  const { t } = useTranslation();

  return (
    <Stack gap="lg">
      <Box>
        <Title order={4} mb="md">
          {t("appSettings.sections.general")}
        </Title>

        <Stack gap="md">
          <FormSelect
            name="language"
            label={t("appSettings.language.label")}
            selectProps={{
              options: [
                { value: "ru", label: t("appSettings.languages.ru") },
                { value: "en", label: t("appSettings.languages.en") },
              ],
              allowDeselect: false,
              comboboxProps: { withinPortal: false },
            }}
          />

          <FormCheckbox
            name="openLastChat"
            label={t("appSettings.openLastChat.label")}
            infoTip={t("appSettings.openLastChat.info")}
          />

          <FormCheckbox
            name="autoSelectCurrentPersona"
            label={t("appSettings.autoSelectCurrentPersona.label")}
            infoTip={t("appSettings.autoSelectCurrentPersona.info")}
          />
        </Stack>
      </Box>
    </Stack>
  );
};
