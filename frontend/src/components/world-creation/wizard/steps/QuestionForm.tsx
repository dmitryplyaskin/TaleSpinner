import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, CircularProgress, Chip, Paper, Alert } from "@mui/material";
import { BASE_URL } from "../../../../const";
import { GenerationProgress } from "./GenerationProgress";
import type { AgentAnalysis, WorldData, AgentQuestion } from "../../../../types/world-creation";

interface Props {
  sessionId: string;
  initialInput: string;
  onComplete: (worldData: WorldData) => void;
  onError?: (error: string) => void;
}

type Phase = "analyzing" | "questions" | "generating";

export const QuestionForm: React.FC<Props> = ({ sessionId, initialInput, onComplete, onError }) => {
  const [phase, setPhase] = useState<Phase>("analyzing");
  const [questions, setQuestions] = useState<AgentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AgentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeInitialInput = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/world-creation/agent/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userInput: initialInput }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to analyze input");
      }
      
      const data: AgentAnalysis = await res.json();
      setAnalysis(data);
      setQuestions(data.questions);
      
      // If already ready (no questions needed), start generation immediately
      if (data.is_ready || data.questions.length === 0) {
        await startGeneration({});
      } else {
        setPhase("questions");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to analyze input";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const startGeneration = async (answersToSubmit: Record<string, string> = answers) => {
    setLoading(true);
    setError(null);
    
    try {
      // Сначала отправляем ответы если есть
      if (Object.keys(answersToSubmit).length > 0) {
        const submitRes = await fetch(`${BASE_URL}/world-creation/agent/submit-answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, answers: answersToSubmit }),
        });
        
        if (!submitRes.ok) {
          throw new Error("Failed to submit answers");
        }
        
        // Если submit-answers вернул мир напрямую (legacy режим)
        const data = await submitRes.json();
        if (data.name && data.world_primer) {
          onComplete(data as WorldData);
          return;
        }
      }
      
      // Переходим к фазе генерации с прогрессом
      setPhase("generating");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to start generation";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerationComplete = async () => {
    // Получаем сгенерированный мир
    try {
      const res = await fetch(`${BASE_URL}/world-creation/agent/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to get generated world");
      }
      
      const data: WorldData = await res.json();
      onComplete(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to get world data";
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleGenerationError = (errorMsg: string) => {
    setError(errorMsg);
    onError?.(errorMsg);
    setPhase("questions");
  };

  // Initial analysis on mount
  useEffect(() => {
    analyzeInitialInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Фаза анализа
  if (phase === "analyzing" && loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Анализирую информацию...</Typography>
      </Box>
    );
  }

  // Фаза генерации
  if (phase === "generating") {
    return (
      <GenerationProgress
        sessionId={sessionId}
        onComplete={handleGenerationComplete}
        onError={handleGenerationError}
      />
    );
  }

  // Фаза вопросов
  return (
    <Box sx={{ display: "flex", gap: 4, height: "100%" }}>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>Уточните детали мира</Typography>
          <Typography variant="body2" color="text.secondary">
            Ответьте на вопросы или оставьте поля пустыми / напишите "решай сам" для автогенерации
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {questions.length === 0 && !loading && (
          <Alert severity="info">
            Достаточно информации для генерации мира. Нажмите "Сгенерировать мир".
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {questions.map((q) => (
            <Paper key={q.id} sx={{ p: 3, bgcolor: "background.default" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Chip label={q.category} size="small" color="primary" variant="outlined" />
              </Box>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                {q.text}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder='Ваш ответ или оставьте пустым / напишите "решай сам"'
                value={answers[q.id] || ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                disabled={loading}
              />
            </Paper>
          ))}
        </Box>

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => startGeneration(answers)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Сгенерировать мир"}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => startGeneration({})}
            disabled={loading}
          >
            Полная автогенерация
          </Button>
        </Box>
      </Box>

      {/* Knowledge Base Panel */}
      <Box sx={{ width: 300, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6">База знаний</Typography>
        
        <Box>
          <Typography variant="subtitle2" gutterBottom>Известная информация:</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {analysis?.known_info.map((info, idx) => (
              <Chip 
                key={idx} 
                label={info.length > 30 ? info.substring(0, 30) + "..." : info} 
                title={info} 
                size="small" 
                color="success"
              />
            ))}
            {(!analysis?.known_info || analysis.known_info.length === 0) && (
              <Typography variant="body2" color="text.secondary">Нет данных</Typography>
            )}
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>Недостающая информация:</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {analysis?.missing_info.map((info, idx) => (
              <Chip key={idx} label={info} color="warning" size="small" variant="outlined" />
            ))}
            {(!analysis?.missing_info || analysis.missing_info.length === 0) && (
              <Typography variant="body2" color="text.secondary">Нет данных</Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: "info.light", borderRadius: 1 }}>
          <Typography variant="caption" color="info.dark">
            💡 Совет: Во время генерации агенты могут задавать уточняющие вопросы для создания более качественного мира
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
