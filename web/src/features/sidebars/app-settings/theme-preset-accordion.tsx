import { Accordion, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { UiThemePresetDto } from "../../../api/ui-theme";

type ThemePresetAccordionProps = {
  draftPreset: UiThemePresetDto;
  onChange: (next: UiThemePresetDto) => void;
};

type ThemeSectionProps = ThemePresetAccordionProps;

const ThemeTokenSection = ({ draftPreset, onChange }: ThemeSectionProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Accordion.Item value="light">
        <Accordion.Control>{t("appSettings.theming.lightTokens")}</Accordion.Control>
      <Accordion.Panel>
        <Stack gap="xs">
          {Object.entries(draftPreset.payload.lightTokens).map(([key, value]) => (
            <TextInput
              key={`light-${key}`}
              label={key}
              value={value}
              onChange={(event) =>
                onChange({
                  ...draftPreset,
                  payload: {
                    ...draftPreset.payload,
                    lightTokens: {
                      ...draftPreset.payload.lightTokens,
                      [key]: event.currentTarget.value,
                    },
                  },
                })
              }
              disabled={draftPreset.builtIn}
            />
          ))}
        </Stack>
      </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="dark">
        <Accordion.Control>{t("appSettings.theming.darkTokens")}</Accordion.Control>
      <Accordion.Panel>
        <Stack gap="xs">
          {Object.entries(draftPreset.payload.darkTokens).map(([key, value]) => (
            <TextInput
              key={`dark-${key}`}
              label={key}
              value={value}
              onChange={(event) =>
                onChange({
                  ...draftPreset,
                  payload: {
                    ...draftPreset.payload,
                    darkTokens: {
                      ...draftPreset.payload.darkTokens,
                      [key]: event.currentTarget.value,
                    },
                  },
                })
              }
              disabled={draftPreset.builtIn}
            />
          ))}
        </Stack>
      </Accordion.Panel>
      </Accordion.Item>
    </>
  );
};

const ThemeTypographySection = ({ draftPreset, onChange }: ThemeSectionProps) => {
  const { t } = useTranslation();

  return (
    <Accordion.Item value="typography">
      <Accordion.Control>{t("appSettings.theming.typography")}</Accordion.Control>
    <Accordion.Panel>
      <Stack gap="xs">
        <TextInput
          label="uiFontFamily"
          value={draftPreset.payload.typography.uiFontFamily}
          onChange={(event) =>
            onChange({
              ...draftPreset,
              payload: {
                ...draftPreset.payload,
                typography: {
                  ...draftPreset.payload.typography,
                  uiFontFamily: event.currentTarget.value,
                },
              },
            })
          }
          disabled={draftPreset.builtIn}
        />
        <TextInput
          label="chatFontFamily"
          value={draftPreset.payload.typography.chatFontFamily}
          onChange={(event) =>
            onChange({
              ...draftPreset,
              payload: {
                ...draftPreset.payload,
                typography: {
                  ...draftPreset.payload.typography,
                  chatFontFamily: event.currentTarget.value,
                },
              },
            })
          }
          disabled={draftPreset.builtIn}
        />
        <TextInput
          label="uiBaseFontSize"
          value={draftPreset.payload.typography.uiBaseFontSize}
          onChange={(event) =>
            onChange({
              ...draftPreset,
              payload: {
                ...draftPreset.payload,
                typography: {
                  ...draftPreset.payload.typography,
                  uiBaseFontSize: event.currentTarget.value,
                },
              },
            })
          }
          disabled={draftPreset.builtIn}
        />
        <TextInput
          label="chatBaseFontSize"
          value={draftPreset.payload.typography.chatBaseFontSize}
          onChange={(event) =>
            onChange({
              ...draftPreset,
              payload: {
                ...draftPreset.payload,
                typography: {
                  ...draftPreset.payload.typography,
                  chatBaseFontSize: event.currentTarget.value,
                },
              },
            })
          }
          disabled={draftPreset.builtIn}
        />
      </Stack>
    </Accordion.Panel>
    </Accordion.Item>
  );
};

const ThemeMarkdownSection = ({ draftPreset, onChange }: ThemeSectionProps) => {
  const { t } = useTranslation();

  return (
    <Accordion.Item value="markdown">
      <Accordion.Control>{t("appSettings.theming.markdown")}</Accordion.Control>
    <Accordion.Panel>
      <Stack gap="xs">
        <TextInput
          label="fontSize"
          value={draftPreset.payload.markdown.fontSize}
          onChange={(event) =>
            onChange({
              ...draftPreset,
              payload: {
                ...draftPreset.payload,
                markdown: {
                  ...draftPreset.payload.markdown,
                  fontSize: event.currentTarget.value,
                },
              },
            })
          }
          disabled={draftPreset.builtIn}
        />
        <TextInput
          label="lineHeight"
          value={draftPreset.payload.markdown.lineHeight}
          onChange={(event) =>
            onChange({
              ...draftPreset,
              payload: {
                ...draftPreset.payload,
                markdown: {
                  ...draftPreset.payload.markdown,
                  lineHeight: event.currentTarget.value,
                },
              },
            })
          }
          disabled={draftPreset.builtIn}
        />
        <TextInput
          label="codeFontSize"
          value={draftPreset.payload.markdown.codeFontSize}
          onChange={(event) =>
            onChange({
              ...draftPreset,
              payload: {
                ...draftPreset.payload,
                markdown: {
                  ...draftPreset.payload.markdown,
                  codeFontSize: event.currentTarget.value,
                },
              },
            })
          }
          disabled={draftPreset.builtIn}
        />
      </Stack>
    </Accordion.Panel>
    </Accordion.Item>
  );
};

const ThemeCssSection = ({ draftPreset, onChange }: ThemeSectionProps) => {
  const { t } = useTranslation();

  return (
    <Accordion.Item value="css">
      <Accordion.Control>{t("appSettings.theming.customCss")}</Accordion.Control>
      <Accordion.Panel>
        <Textarea
          value={draftPreset.payload.customCss}
          onChange={(event) =>
            onChange({
              ...draftPreset,
              payload: { ...draftPreset.payload, customCss: event.currentTarget.value },
            })
          }
          autosize
          minRows={8}
          maxRows={18}
          disabled={draftPreset.builtIn}
        />
        <Text size="xs" c="dimmed" mt={6}>
          {t("appSettings.theming.customCssHint")}
        </Text>
      </Accordion.Panel>
    </Accordion.Item>
  );
};

export const ThemePresetAccordion = ({ draftPreset, onChange }: ThemePresetAccordionProps) => {
  return (
    <Accordion variant="separated" defaultValue="light">
      <ThemeTokenSection draftPreset={draftPreset} onChange={onChange} />
      <ThemeTypographySection draftPreset={draftPreset} onChange={onChange} />
      <ThemeMarkdownSection draftPreset={draftPreset} onChange={onChange} />
      <ThemeCssSection draftPreset={draftPreset} onChange={onChange} />
    </Accordion>
  );
};
