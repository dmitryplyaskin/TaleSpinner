import { Accordion, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { useTranslation } from "react-i18next";

import {
  THEME_MARKDOWN_META,
  THEME_TOKEN_META,
  THEME_TYPOGRAPHY_META,
} from "./theme-field-metadata";

import type { UiThemePresetDto } from "../../../api/ui-theme";
import type { UiThemeMarkdown, UiThemeTokenMap, UiThemeTypography } from "@shared/types/ui-theme";

type ThemePresetAccordionProps = {
  draftPreset: UiThemePresetDto;
  onChange: (next: UiThemePresetDto) => void;
};

function ThemeTokenInputs(props: {
  tokens: UiThemeTokenMap;
  disabled: boolean;
  onChange: (next: UiThemeTokenMap) => void;
}) {
  const { t } = useTranslation();

  return (
    <Stack gap="xs">
      {Object.entries(props.tokens).map(([key, value]) => {
        const meta = THEME_TOKEN_META[key];
        return (
          <TextInput
            key={key}
            label={meta ? t(meta.labelKey) : key}
            description={
              meta ? t(meta.descriptionKey, { variable: key }) : key
            }
            value={value}
            onChange={(event) =>
              props.onChange({
                ...props.tokens,
                [key]: event.currentTarget.value,
              })
            }
            disabled={props.disabled}
          />
        );
      })}
    </Stack>
  );
}

function ThemeTypographyInputs(props: {
  typography: UiThemeTypography;
  disabled: boolean;
  onChange: (next: UiThemeTypography) => void;
}) {
  const { t } = useTranslation();

  return (
    <Stack gap="xs">
      {Object.entries(THEME_TYPOGRAPHY_META).map(([key, meta]) => (
        <TextInput
          key={key}
          label={t(meta.labelKey)}
          description={t(meta.descriptionKey)}
          value={props.typography[key as keyof UiThemeTypography]}
          onChange={(event) =>
            props.onChange({
              ...props.typography,
              [key]: event.currentTarget.value,
            })
          }
          disabled={props.disabled}
        />
      ))}
    </Stack>
  );
}

function ThemeMarkdownInputs(props: {
  markdown: UiThemeMarkdown;
  disabled: boolean;
  onChange: (next: UiThemeMarkdown) => void;
}) {
  const { t } = useTranslation();

  return (
    <Stack gap="xs">
      {Object.entries(THEME_MARKDOWN_META).map(([key, meta]) => (
        <TextInput
          key={key}
          label={t(meta.labelKey)}
          description={t(meta.descriptionKey)}
          value={props.markdown[key as keyof UiThemeMarkdown]}
          onChange={(event) =>
            props.onChange({
              ...props.markdown,
              [key]: event.currentTarget.value,
            })
          }
          disabled={props.disabled}
        />
      ))}
    </Stack>
  );
}

export const ThemePresetAccordion = ({ draftPreset, onChange }: ThemePresetAccordionProps) => {
  const { t } = useTranslation();

  return (
    <Accordion variant="separated" defaultValue="light">
      <Accordion.Item value="light">
        <Accordion.Control>{t("appSettings.theming.lightTokens")}</Accordion.Control>
        <Accordion.Panel>
          <ThemeTokenInputs
            tokens={draftPreset.payload.lightTokens}
            disabled={draftPreset.builtIn}
            onChange={(lightTokens) =>
              onChange({
                ...draftPreset,
                payload: {
                  ...draftPreset.payload,
                  lightTokens,
                },
              })
            }
          />
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="dark">
        <Accordion.Control>{t("appSettings.theming.darkTokens")}</Accordion.Control>
        <Accordion.Panel>
          <ThemeTokenInputs
            tokens={draftPreset.payload.darkTokens}
            disabled={draftPreset.builtIn}
            onChange={(darkTokens) =>
              onChange({
                ...draftPreset,
                payload: {
                  ...draftPreset.payload,
                  darkTokens,
                },
              })
            }
          />
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="typography">
        <Accordion.Control>{t("appSettings.theming.typography")}</Accordion.Control>
        <Accordion.Panel>
          <ThemeTypographyInputs
            typography={draftPreset.payload.typography}
            disabled={draftPreset.builtIn}
            onChange={(typography) =>
              onChange({
                ...draftPreset,
                payload: {
                  ...draftPreset.payload,
                  typography,
                },
              })
            }
          />
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="markdown">
        <Accordion.Control>{t("appSettings.theming.markdown")}</Accordion.Control>
        <Accordion.Panel>
          <ThemeMarkdownInputs
            markdown={draftPreset.payload.markdown}
            disabled={draftPreset.builtIn}
            onChange={(markdown) =>
              onChange({
                ...draftPreset,
                payload: {
                  ...draftPreset.payload,
                  markdown,
                },
              })
            }
          />
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item value="css">
        <Accordion.Control>{t("appSettings.theming.customCss")}</Accordion.Control>
        <Accordion.Panel>
          <Textarea
            label={t("appSettings.theming.fields.customCss.label")}
            description={t("appSettings.theming.fields.customCss.description")}
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
    </Accordion>
  );
};
