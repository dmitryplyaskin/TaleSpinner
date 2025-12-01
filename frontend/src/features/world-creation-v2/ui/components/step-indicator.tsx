import React from "react";
import { Box, Typography } from "@mui/material";
import { Check } from "@mui/icons-material";
import type { WizardStepV2 } from "../../model/types";
import { STEP_METADATA } from "../../model/types";

interface StepIndicatorProps {
  currentStep: WizardStepV2;
}

const STEPS: Array<{ key: WizardStepV2; label: string }> = [
  { key: "genre", label: "Жанр" },
  { key: "input", label: "Описание" },
  { key: "architect", label: "Уточнение" },
  { key: "generation", label: "Генерация" },
  { key: "review", label: "Результат" },
];

/**
 * Индикатор шагов wizard
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const currentIndex = STEP_METADATA[currentStep]?.index ?? 0;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 0,
        mb: 4,
      }}
    >
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <React.Fragment key={step.key}>
            {/* Шаг */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
              }}
            >
              {/* Кружок */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  ...(isCompleted && {
                    background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
                    boxShadow: "0 4px 12px rgba(76, 175, 80, 0.4)",
                  }),
                  ...(isCurrent && {
                    background: "linear-gradient(135deg, #e94560 0%, #c23a51 100%)",
                    boxShadow: "0 4px 12px rgba(233, 69, 96, 0.4)",
                    animation: "pulse-glow 2s infinite",
                  }),
                  ...(isUpcoming && {
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                  }),
                }}
              >
                {isCompleted ? (
                  <Check sx={{ color: "#fff", fontSize: 20 }} />
                ) : (
                  <Typography
                    sx={{
                      color: isCurrent ? "#fff" : "rgba(255, 255, 255, 0.5)",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {index + 1}
                  </Typography>
                )}
              </Box>

              {/* Подпись */}
              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  color: isCurrent
                    ? "text.primary"
                    : isCompleted
                      ? "success.main"
                      : "text.secondary",
                  fontWeight: isCurrent ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </Typography>
            </Box>

            {/* Линия между шагами */}
            {index < STEPS.length - 1 && (
              <Box
                sx={{
                  width: 60,
                  height: 2,
                  mx: 1,
                  mt: -2.5,
                  background: isCompleted
                    ? "linear-gradient(90deg, #4caf50, #4caf50)"
                    : "rgba(255, 255, 255, 0.1)",
                  transition: "all 0.3s ease",
                }}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Стили для анимации */}
      <style>
        {`
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 4px 12px rgba(233, 69, 96, 0.4);
            }
            50% {
              box-shadow: 0 4px 20px rgba(233, 69, 96, 0.6);
            }
          }
        `}
      </style>
    </Box>
  );
};

