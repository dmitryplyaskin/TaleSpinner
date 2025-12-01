import React from "react";
import { Box, Typography, LinearProgress, Chip } from "@mui/material";
import { Check, HourglassEmpty, Error } from "@mui/icons-material";
import type { GenerationProgress } from "../../model/types";
import { GlassCard } from "./glass-card";

interface ProgressIndicatorProps {
  progress: GenerationProgress;
}

/**
 * Индикатор прогресса генерации
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
}) => {
  const { currentElement, completedElements, totalElements, status, error } =
    progress;

  const percentage =
    totalElements > 0 ? (completedElements.length / totalElements) * 100 : 0;

  const getStatusIcon = (element: string) => {
    if (completedElements.includes(element)) {
      return <Check sx={{ fontSize: 16, color: "success.main" }} />;
    }
    if (element === currentElement) {
      return (
        <HourglassEmpty
          sx={{
            fontSize: 16,
            color: "primary.main",
            animation: "pulse 1.5s infinite",
          }}
        />
      );
    }
    return null;
  };

  const getStatusColor = (element: string): "success" | "primary" | "default" => {
    if (completedElements.includes(element)) return "success";
    if (element === currentElement) return "primary";
    return "default";
  };

  return (
    <GlassCard sx={{ p: 3 }}>
      {/* Заголовок и процент */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: "text.primary" }}>
          Генерация мира
        </Typography>
        <Typography
          variant="h5"
          sx={{ color: "primary.main", fontWeight: 600 }}
        >
          {Math.round(percentage)}%
        </Typography>
      </Box>

      {/* Прогресс-бар */}
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          mb: 3,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          "& .MuiLinearProgress-bar": {
            borderRadius: 4,
            background: "linear-gradient(90deg, #e94560 0%, #4a90a4 100%)",
          },
        }}
      />

      {/* Статус */}
      {status === "generating" && currentElement && (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 2, fontStyle: "italic" }}
        >
          Генерируется: {currentElement}...
        </Typography>
      )}

      {status === "waiting_for_input" && (
        <Typography
          variant="body2"
          sx={{ color: "warning.main", mb: 2 }}
        >
          Ожидается ваш ответ...
        </Typography>
      )}

      {status === "error" && error && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Error sx={{ color: "error.main" }} />
          <Typography variant="body2" sx={{ color: "error.main" }}>
            {error}
          </Typography>
        </Box>
      )}

      {/* Чипы элементов */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {[...completedElements, currentElement]
          .filter(Boolean)
          .map((element) => (
            <Chip
              key={element}
              label={element}
              size="small"
              color={getStatusColor(element)}
              icon={getStatusIcon(element) || undefined}
              sx={{
                "& .MuiChip-label": {
                  textTransform: "capitalize",
                },
              }}
            />
          ))}
      </Box>

      {/* Стили для анимации */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </GlassCard>
  );
};

