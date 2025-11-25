import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  Chip,
  Paper,
  Alert,
} from "@mui/material";
import { BASE_URL } from "../../../../const";
import type { AgentAnalysis, WorldData } from "../../../../types/world-creation";
import { GenerationProgress } from "./GenerationProgress";

interface Props {
  sessionId: string;
  initialInput: string;
  onComplete: (worldData: WorldData) => void;
  onError?: (error: string) => void;
}

interface Message {
  role: "user" | "agent";
  text: string;
}

export const AgentChat: React.FC<Props> = ({
  sessionId,
  initialInput,
  onComplete,
  onError,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "user", text: initialInput },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AgentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generatedWorldDataRef = useRef<WorldData | null>(null);
  const isGenerationStartedRef = useRef(false);

  const analyze = async (userInput: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/world-creation/agent/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userInput }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze input");
      }

      const data: AgentAnalysis = await res.json();
      setAnalysis(data);

      if (data.questions && data.questions.length > 0) {
        setMessages((prev) => [
          ...prev,
          { role: "agent", text: data.questions[0].text },
        ]);
      } else if (data.is_ready) {
        setMessages((prev) => [
          ...prev,
          { role: "agent", text: "Достаточно информации. Начинаю генерацию мира..." },
        ]);
        startGeneration();
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to analyze input";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const startGeneration = () => {
    // Prevent duplicate generation calls
    if (isGenerationStartedRef.current) {
      return;
    }
    isGenerationStartedRef.current = true;
    setIsGenerating(true);
    setError(null);

    // Start generation in background - we'll track progress via polling
    fetch(`${BASE_URL}/world-creation/agent/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to generate world");
        }
        const data: WorldData = await res.json();
        generatedWorldDataRef.current = data;
      })
      .catch((err) => {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to generate world";
        setError(errorMsg);
        onError?.(errorMsg);
        setIsGenerating(false);
        isGenerationStartedRef.current = false;
      });
  };

  const handleGenerationComplete = () => {
    // Wait for the generate request to complete and set the data
    const checkData = () => {
      if (generatedWorldDataRef.current) {
        onComplete(generatedWorldDataRef.current);
      } else {
        // If data not ready yet, wait and check again
        setTimeout(checkData, 500);
      }
    };
    checkData();
  };

  const handleGenerationError = (errorMsg: string) => {
    setError(errorMsg);
    setIsGenerating(false);
    isGenerationStartedRef.current = false;
    onError?.(errorMsg);
  };

  // Initial analysis on mount
  useEffect(() => {
    analyze(initialInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    analyze(input);
    setInput("");
  };

  // Show generation progress when generating
  if (isGenerating) {
    return (
      <GenerationProgress
        sessionId={sessionId}
        onComplete={handleGenerationComplete}
        onError={handleGenerationError}
      />
    );
  }

  return (
    <Box sx={{ display: "flex", gap: 4, height: "100%" }}>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6">Диалог</Typography>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: 2,
            p: 2,
            minHeight: 400,
            maxHeight: 600,
            background: "rgba(15, 23, 42, 0.5)",
          }}
        >
          <List>
            {messages.map((msg, idx) => (
              <ListItem
                key={idx}
                alignItems="flex-start"
                sx={{
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    bgcolor:
                      msg.role === "user"
                        ? "rgba(99, 102, 241, 0.2)"
                        : "rgba(51, 65, 85, 0.5)",
                    maxWidth: "80%",
                    border:
                      msg.role === "user"
                        ? "1px solid rgba(99, 102, 241, 0.3)"
                        : "1px solid rgba(71, 85, 105, 0.3)",
                  }}
                >
                  <Typography variant="body1" sx={{ color: "#e2e8f0" }}>
                    {msg.text}
                  </Typography>
                </Paper>
              </ListItem>
            ))}
            {loading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "#818cf8",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Анализирую...
                </Typography>
              </Box>
            )}
          </List>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Введите ваш ответ..."
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(15, 23, 42, 0.5)",
                "& fieldset": {
                  borderColor: "rgba(99, 102, 241, 0.2)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(99, 102, 241, 0.4)",
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            sx={{
              bgcolor: "#6366f1",
              "&:hover": {
                bgcolor: "#4f46e5",
              },
            }}
          >
            Отправить
          </Button>
        </Box>
      </Box>

      <Box sx={{ width: 300, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6" sx={{ color: "#e2e8f0" }}>
          База знаний
        </Typography>
        <Typography variant="subtitle2" sx={{ color: "#94a3b8" }}>
          Известные факты:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {analysis?.known_info.map((info, idx) => (
            <Chip
              key={idx}
              label={info.length > 30 ? info.substring(0, 30) + "..." : info}
              title={info}
              size="small"
              sx={{
                bgcolor: "rgba(34, 197, 94, 0.15)",
                color: "#4ade80",
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
            />
          ))}
        </Box>

        <Typography variant="subtitle2" sx={{ mt: 2, color: "#94a3b8" }}>
          Недостающая информация:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {analysis?.missing_info.map((info, idx) => (
            <Chip
              key={idx}
              label={info}
              size="small"
              variant="outlined"
              sx={{
                borderColor: "rgba(251, 191, 36, 0.5)",
                color: "#fbbf24",
              }}
            />
          ))}
        </Box>

        {analysis?.is_ready && (
          <Button
            variant="contained"
            onClick={startGeneration}
            disabled={loading || isGenerationStartedRef.current}
            sx={{
              mt: 2,
              bgcolor: "#22c55e",
              "&:hover": {
                bgcolor: "#16a34a",
              },
            }}
          >
            Сгенерировать мир
          </Button>
        )}
      </Box>
    </Box>
  );
};
