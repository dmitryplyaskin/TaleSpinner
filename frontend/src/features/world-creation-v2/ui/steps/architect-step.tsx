import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useUnit } from "effector-react";
import { QuestionPanel } from "../components";
import { setAnswer } from "../../model/events";
import {
  $architectClarification,
  $answers,
  $sessionId,
  $isResponding,
} from "../../model/stores";
import { respondToClarificationFx } from "../../model/effects";

/**
 * Шаг 3: Уточняющие вопросы от архитектора
 */
export const ArchitectStep: React.FC = () => {
  const { clarification, answers, sessionId, isResponding } = useUnit({
    clarification: $architectClarification,
    answers: $answers,
    sessionId: $sessionId,
    isResponding: $isResponding,
  });
  const handleSetAnswer = useUnit(setAnswer);

  const handleSubmit = () => {
    if (!sessionId || !clarification) return;

    respondToClarificationFx({
      sessionId,
      requestId: `architect-${clarification.iteration}`,
      answers,
    });
  };

  const handleSkip = () => {
    if (!sessionId || !clarification) return;

    respondToClarificationFx({
      sessionId,
      requestId: `architect-${clarification.iteration}`,
      answers: {},
      skipped: true,
    });
  };

  if (!clarification) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
        }}
      >
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Анализируем ваше описание...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease" }}>
      <QuestionPanel
        title="Уточняющие вопросы"
        reason={clarification.reason}
        questions={clarification.questions}
        answers={answers}
        onAnswerChange={(questionId, value) =>
          handleSetAnswer({ questionId, value })
        }
        onSubmit={handleSubmit}
        onSkip={handleSkip}
        isSubmitting={isResponding}
        iteration={clarification.iteration}
        maxIterations={3}
      />

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

