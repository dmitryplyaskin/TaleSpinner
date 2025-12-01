import React, { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useUnit } from "effector-react";
import { ProgressIndicator, QuestionPanel } from "../components";
import { setAnswer } from "../../model/events";
import {
  $generationProgress,
  $elementsClarification,
  $answers,
  $sessionId,
  $isResponding,
} from "../../model/stores";
import { respondToClarificationFx, getSessionStatusFx } from "../../model/effects";

/**
 * Шаг 4: Генерация элементов мира
 */
export const GenerationStep: React.FC = () => {
  const { progress, clarification, answers, sessionId, isResponding } = useUnit({
    progress: $generationProgress,
    clarification: $elementsClarification,
    answers: $answers,
    sessionId: $sessionId,
    isResponding: $isResponding,
  });
  const handleSetAnswer = useUnit(setAnswer);

  // Периодически проверяем статус
  useEffect(() => {
    if (!sessionId || clarification) return;

    const interval = setInterval(() => {
      getSessionStatusFx(sessionId);
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, clarification]);

  const handleSubmit = () => {
    if (!sessionId || !clarification) return;

    respondToClarificationFx({
      sessionId,
      requestId: `elements-${clarification.elementType}`,
      answers,
    });
  };

  const handleSkip = () => {
    if (!sessionId || !clarification) return;

    respondToClarificationFx({
      sessionId,
      requestId: `elements-${clarification.elementType}`,
      answers: {},
      skipped: true,
    });
  };

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease" }}>
      <Typography
        variant="h4"
        sx={{
          textAlign: "center",
          mb: 4,
          fontWeight: 600,
          background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Генерация мира
      </Typography>

      {/* Прогресс */}
      <Box sx={{ mb: 4 }}>
        <ProgressIndicator progress={progress} />
      </Box>

      {/* Вопросы при генерации элементов */}
      {clarification && (
        <Box sx={{ mt: 4 }}>
          <QuestionPanel
            title={`Уточнение: ${clarification.elementType}`}
            reason={clarification.reason}
            questions={clarification.questions}
            answers={answers}
            onAnswerChange={(questionId, value) =>
              handleSetAnswer({ questionId, value })
            }
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            isSubmitting={isResponding}
          />
        </Box>
      )}

      {/* Анимация генерации */}
      {!clarification && progress.status === "generating" && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 4,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #e94560 0%, #4a90a4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse-rotate 2s infinite",
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: "background.default",
              }}
            />
          </Box>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Создаём ваш мир...
          </Typography>
        </Box>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes pulse-rotate {
            0% {
              transform: rotate(0deg) scale(1);
            }
            50% {
              transform: rotate(180deg) scale(1.1);
            }
            100% {
              transform: rotate(360deg) scale(1);
            }
          }
        `}
      </style>
    </Box>
  );
};

