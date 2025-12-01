import React from "react";
import { Box, Typography, TextField, Button, CircularProgress } from "@mui/material";
import { AutoAwesome, Send } from "@mui/icons-material";
import { useUnit } from "effector-react";
import { GlassCard } from "../components";
import { setUserInput } from "../../model/events";
import {
  $userInput,
  $sessionId,
  $genre,
  $isStartingGeneration,
} from "../../model/stores";
import { startGenerationFx } from "../../model/effects";
import { GenreMetadata } from "../../model/types";

// Примеры описаний для вдохновения
const EXAMPLES = [
  "Фэнтези мир с магией на основе музыки, где барды правят королевствами",
  "Пост-апокалиптический мир, где растения обрели разум и захватили города",
  "Подводная цивилизация в стимпанк стиле с механическими китами",
  "Мир, где сны материализуются и их можно торговать на рынках",
];

/**
 * Шаг 2: Ввод описания мира
 */
export const InputStep: React.FC = () => {
  const { userInput, sessionId, genre, isStarting } = useUnit({
    userInput: $userInput,
    sessionId: $sessionId,
    genre: $genre,
    isStarting: $isStartingGeneration,
  });
  const handleSetInput = useUnit(setUserInput);

  const handleSubmit = () => {
    if (sessionId && userInput.trim()) {
      startGenerationFx({ sessionId, userInput: userInput.trim() });
    }
  };

  const handleExampleClick = (example: string) => {
    handleSetInput(example);
  };

  const genreInfo = genre ? GenreMetadata[genre] : null;

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
        Опишите ваш мир
      </Typography>

      {genreInfo && (
        <Typography
          variant="body1"
          sx={{
            textAlign: "center",
            mb: 4,
            color: "text.secondary",
          }}
        >
          Жанр сюжета:{" "}
          <Box
            component="span"
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            {genreInfo.label}
          </Box>
        </Typography>
      )}

      <GlassCard sx={{ p: 4, mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={6}
          placeholder="Опишите мир, который хотите создать. Это может быть несколько слов или целый абзац — неважно, насколько подробно вы опишете. Если чего-то не хватит, мы спросим..."
          value={userInput}
          onChange={(e) => handleSetInput(e.target.value)}
          disabled={isStarting}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              fontSize: "1.1rem",
              lineHeight: 1.6,
              "& fieldset": {
                borderColor: "rgba(255, 255, 255, 0.1)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(255, 255, 255, 0.2)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "primary.main",
              },
            },
            "& .MuiInputBase-input": {
              color: "text.primary",
            },
            "& .MuiInputBase-input::placeholder": {
              color: "text.secondary",
              opacity: 0.7,
            },
          }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mt: 3,
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={!userInput.trim() || isStarting}
            startIcon={
              isStarting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Send />
              )
            }
            sx={{
              background: "linear-gradient(135deg, #e94560 0%, #c23a51 100%)",
              px: 4,
              py: 1.5,
              "&:hover": {
                background: "linear-gradient(135deg, #c23a51 0%, #a02040 100%)",
              },
              "&:disabled": {
                background: "rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.3)",
              },
            }}
          >
            {isStarting ? "Анализ..." : "Создать мир"}
          </Button>
        </Box>
      </GlassCard>

      {/* Примеры для вдохновения */}
      <Box sx={{ mt: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2,
          }}
        >
          <AutoAwesome sx={{ color: "primary.main", fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
            Нужно вдохновение? Попробуйте:
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {EXAMPLES.map((example, index) => (
            <GlassCard
              key={index}
              variant="subtle"
              onClick={() => handleExampleClick(example)}
              sx={{
                px: 2,
                py: 1,
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {example}
              </Typography>
            </GlassCard>
          ))}
        </Box>
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

