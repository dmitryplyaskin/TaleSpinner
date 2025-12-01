import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Check, Edit } from "@mui/icons-material";
import { useUnit } from "effector-react";
import { GlassCard } from "../components";
import { updateSkeletonField } from "../../model/events";
import { $skeleton, $sessionId, $isApprovingSkeleton } from "../../model/stores";
import { approveSkeletonFx } from "../../model/effects";

/**
 * Шаг 3.5: Просмотр и редактирование скелета мира
 */
export const SkeletonStep: React.FC = () => {
  const { skeleton, sessionId, isApproving } = useUnit({
    skeleton: $skeleton,
    sessionId: $sessionId,
    isApproving: $isApprovingSkeleton,
  });
  const handleUpdateField = useUnit(updateSkeletonField);

  const handleApprove = () => {
    if (!sessionId || !skeleton) return;
    approveSkeletonFx({ sessionId, editedSkeleton: skeleton });
  };

  if (!skeleton) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease" }}>
      <Typography
        variant="h4"
        sx={{
          textAlign: "center",
          mb: 2,
          fontWeight: 600,
          background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Основа вашего мира
      </Typography>

      <Typography
        variant="body1"
        sx={{
          textAlign: "center",
          mb: 4,
          color: "text.secondary",
        }}
      >
        Проверьте и при необходимости отредактируйте базовую информацию о мире
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Название */}
        <GlassCard sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>
            Название мира
          </Typography>
          <TextField
            fullWidth
            value={skeleton.name}
            onChange={(e) =>
              handleUpdateField({ field: "name", value: e.target.value })
            }
            variant="outlined"
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                fontSize: "1.2rem",
                fontWeight: 600,
              },
            }}
          />
        </GlassCard>

        {/* Основные характеристики */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
          <GlassCard sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Сеттинг
            </Typography>
            <TextField
              fullWidth
              value={skeleton.setting}
              onChange={(e) =>
                handleUpdateField({ field: "setting", value: e.target.value })
              }
              variant="standard"
              sx={{ mt: 0.5 }}
            />
          </GlassCard>

          <GlassCard sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Эпоха
            </Typography>
            <TextField
              fullWidth
              value={skeleton.era}
              onChange={(e) =>
                handleUpdateField({ field: "era", value: e.target.value })
              }
              variant="standard"
              sx={{ mt: 0.5 }}
            />
          </GlassCard>

          <GlassCard sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Тон
            </Typography>
            <TextField
              fullWidth
              value={skeleton.tone}
              onChange={(e) =>
                handleUpdateField({ field: "tone", value: e.target.value })
              }
              variant="standard"
              sx={{ mt: 0.5 }}
            />
          </GlassCard>
        </Box>

        {/* Центральный конфликт */}
        <GlassCard sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>
            Центральный конфликт
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={skeleton.coreConflict}
            onChange={(e) =>
              handleUpdateField({ field: "coreConflict", value: e.target.value })
            }
            variant="outlined"
            size="small"
          />
        </GlassCard>

        {/* Описание мира */}
        <GlassCard sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>
            Описание мира
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={skeleton.worldPrimer}
            onChange={(e) =>
              handleUpdateField({ field: "worldPrimer", value: e.target.value })
            }
            variant="outlined"
            size="small"
          />
        </GlassCard>

        {/* Уникальные особенности */}
        <GlassCard sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 2 }}>
            Уникальные особенности
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {skeleton.uniqueFeatures.map((feature, index) => (
              <Chip
                key={index}
                label={feature}
                variant="outlined"
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "text.primary",
                }}
              />
            ))}
          </Box>
        </GlassCard>

        {/* Элементы для генерации */}
        <GlassCard sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 2 }}>
            Будут сгенерированы
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {skeleton.elementsToGenerate.map((element) => (
              <Chip
                key={element}
                label={element.replace("_", " ")}
                color="primary"
                size="small"
                sx={{ textTransform: "capitalize" }}
              />
            ))}
          </Box>
        </GlassCard>
      </Box>

      {/* Кнопка подтверждения */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 4,
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={handleApprove}
          disabled={isApproving}
          startIcon={
            isApproving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Check />
            )
          }
          sx={{
            background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
            px: 6,
            py: 1.5,
            "&:hover": {
              background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
            },
          }}
        >
          {isApproving ? "Запуск генерации..." : "Подтвердить и продолжить"}
        </Button>
      </Box>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

