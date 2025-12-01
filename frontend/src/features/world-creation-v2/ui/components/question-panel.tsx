import React from "react";
import {
  Box,
  Typography,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  CircularProgress,
} from "@mui/material";
import { Send, SkipNext } from "@mui/icons-material";
import type { ArchitectQuestion } from "../../model/types";
import { GlassCard } from "./glass-card";

interface QuestionPanelProps {
  title: string;
  reason: string;
  questions: ArchitectQuestion[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, value: string) => void;
  onSubmit: () => void;
  onSkip?: () => void;
  isSubmitting?: boolean;
  iteration?: number;
  maxIterations?: number;
}

/**
 * Панель вопросов для HITL
 */
export const QuestionPanel: React.FC<QuestionPanelProps> = ({
  title,
  reason,
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  onSkip,
  isSubmitting = false,
  iteration = 1,
  maxIterations = 3,
}) => {
  const allAnswered = questions.every(
    (q) => answers[q.id] && answers[q.id].trim() !== ""
  );

  return (
    <Box sx={{ animation: "fadeIn 0.3s ease" }}>
      {/* Заголовок */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
            {title}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              px: 2,
              py: 0.5,
              borderRadius: 2,
            }}
          >
            {iteration} / {maxIterations}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {reason}
        </Typography>
      </Box>

      {/* Вопросы */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {questions.map((question, index) => (
          <GlassCard
            key={question.id}
            variant="subtle"
            sx={{
              p: 3,
              animation: `slideIn 0.3s ease ${index * 0.1}s both`,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 500, mb: 2, color: "text.primary" }}
            >
              {question.question}
            </Typography>

            {/* Варианты ответов */}
            <RadioGroup
              value={answers[question.id] || ""}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
            >
              {question.options.map((option) => (
                <FormControlLabel
                  key={option.id}
                  value={option.label}
                  control={
                    <Radio
                      sx={{
                        color: "rgba(255, 255, 255, 0.5)",
                        "&.Mui-checked": {
                          color: "primary.main",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: "text.primary" }}>
                      {option.label}
                    </Typography>
                  }
                  sx={{
                    mb: 1,
                    p: 1,
                    borderRadius: 2,
                    transition: "background 0.2s",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    },
                  }}
                />
              ))}
            </RadioGroup>

            {/* Свой вариант */}
            {question.allowCustomAnswer && (
              <TextField
                fullWidth
                size="small"
                placeholder="Или введите свой вариант..."
                value={
                  question.options.some((o) => o.label === answers[question.id])
                    ? ""
                    : answers[question.id] || ""
                }
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                sx={{
                  mt: 2,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
                }}
              />
            )}
          </GlassCard>
        ))}
      </Box>

      {/* Кнопки */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
          mt: 4,
        }}
      >
        {onSkip && (
          <Button
            variant="outlined"
            onClick={onSkip}
            disabled={isSubmitting}
            startIcon={<SkipNext />}
            sx={{
              borderColor: "rgba(255, 255, 255, 0.2)",
              color: "text.secondary",
              "&:hover": {
                borderColor: "rgba(255, 255, 255, 0.4)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
              },
            }}
          >
            Пропустить
          </Button>
        )}
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={!allAnswered || isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Send />
            )
          }
          sx={{
            background: "linear-gradient(135deg, #e94560 0%, #c23a51 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #c23a51 0%, #a02040 100%)",
            },
            "&:disabled": {
              background: "rgba(255, 255, 255, 0.1)",
              color: "rgba(255, 255, 255, 0.3)",
            },
          }}
        >
          Продолжить
        </Button>
      </Box>

      {/* Стили для анимаций */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  );
};

