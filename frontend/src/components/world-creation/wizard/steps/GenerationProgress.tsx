import React, { useEffect, useState, useRef, useCallback } from "react";
import { Box, Typography, keyframes, styled, Button } from "@mui/material";
import { BASE_URL } from "../../../../const";
import { ClarificationRenderer } from "../../../clarification";
import type {
  GenerationProgress as GenerationProgressType,
  AgentStatus,
} from "../../../../types/world-creation";
import type {
  ClarificationRequest,
  ClarificationResponse,
} from "@shared/types/human-in-the-loop";

interface Props {
  sessionId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

interface AgentInfo {
  key: keyof GenerationProgressType;
  label: string;
  icon: string;
}

// Типы для SSE событий
interface StreamEvent {
  type?: "done" | "error";
  node?: string;
  status?: "started" | "completed" | "error" | "waiting_for_input";
  data?: Partial<GenerationProgressType>;
  clarification?: ClarificationRequest;
  error?: string;
}

const AGENTS: AgentInfo[] = [
  { key: "base", label: "Основа мира", icon: "🌍" },
  { key: "factions", label: "Фракции", icon: "⚔️" },
  { key: "locations", label: "Локации", icon: "🏰" },
  { key: "races", label: "Расы", icon: "👥" },
  { key: "history", label: "История", icon: "📜" },
  { key: "magic", label: "Магия", icon: "✨" },
];

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(4),
  minHeight: 400,
  background:
    "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)",
  borderRadius: theme.spacing(2),
  border: "1px solid rgba(99, 102, 241, 0.2)",
}));

const Title = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  fontWeight: 600,
  background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  textAlign: "center",
}));

const AgentsGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: theme.spacing(3),
  width: "100%",
  maxWidth: 600,
}));

const AgentCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== "status" && prop !== "index",
})<{ status: AgentStatus; index: number }>(({ status, index }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: 16,
  borderRadius: 12,
  background:
    status === "completed"
      ? "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)"
      : status === "in_progress"
        ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)"
        : status === "failed"
          ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)"
          : "rgba(51, 65, 85, 0.3)",
  border: `1px solid ${
    status === "completed"
      ? "rgba(34, 197, 94, 0.3)"
      : status === "in_progress"
        ? "rgba(99, 102, 241, 0.3)"
        : status === "failed"
          ? "rgba(239, 68, 68, 0.3)"
          : "rgba(71, 85, 105, 0.3)"
  }`,
  transition: "all 0.3s ease",
  animation: `${fadeIn} 0.5s ease forwards`,
  animationDelay: `${index * 0.1}s`,
  opacity: 0,
}));

const IconWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "status",
})<{ status: AgentStatus }>(({ status }) => ({
  fontSize: "2rem",
  marginBottom: 8,
  position: "relative",
  ...(status === "in_progress" && {
    animation: `${pulse} 2s infinite`,
  }),
}));

const Spinner = styled(Box)(() => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  width: 48,
  height: 48,
  marginTop: -24,
  marginLeft: -24,
  border: "2px solid transparent",
  borderTopColor: "#818cf8",
  borderRadius: "50%",
  animation: `${spin} 1s linear infinite`,
}));

const StatusBadge = styled(Box, {
  shouldForwardProp: (prop) => prop !== "status",
})<{ status: AgentStatus }>(({ status }) => ({
  fontSize: "0.75rem",
  padding: "2px 8px",
  borderRadius: 4,
  marginTop: 4,
  background:
    status === "completed"
      ? "rgba(34, 197, 94, 0.2)"
      : status === "in_progress"
        ? "rgba(99, 102, 241, 0.2)"
        : status === "failed"
          ? "rgba(239, 68, 68, 0.2)"
          : "rgba(71, 85, 105, 0.2)",
  color:
    status === "completed"
      ? "#4ade80"
      : status === "in_progress"
        ? "#a5b4fc"
        : status === "failed"
          ? "#f87171"
          : "#94a3b8",
}));

const getStatusText = (status: AgentStatus): string => {
  switch (status) {
    case "pending":
      return "Ожидание";
    case "in_progress":
      return "Генерация...";
    case "completed":
      return "Готово";
    case "failed":
      return "Ошибка";
    default:
      return "";
  }
};

export const GenerationProgress: React.FC<Props> = ({
  sessionId,
  onComplete,
  onError,
}) => {
  const [progress, setProgress] = useState<GenerationProgressType>({
    base: "pending",
    factions: "pending",
    locations: "pending",
    races: "pending",
    history: "pending",
    magic: "pending",
  });
  const [clarificationRequest, setClarificationRequest] = useState<ClarificationRequest | null>(null);
  const [useStreaming, setUseStreaming] = useState(true);

  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const isCompletedRef = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  // Обработка ответа на уточнение
  const handleClarificationSubmit = useCallback(async (response: ClarificationResponse) => {
    setClarificationRequest(null);
    
    try {
      const res = await fetch(`${BASE_URL}/world-creation/agent/generate/${sessionId}/continue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });

      if (!res.ok) {
        throw new Error("Failed to continue generation");
      }

      const data = await res.json();

      if (data.status === "waiting_for_input" && data.clarification) {
        setClarificationRequest(data.clarification);
      } else if (data.status === "completed") {
        isCompletedRef.current = true;
        onCompleteRef.current();
      } else if (data.status === "error") {
        isCompletedRef.current = true;
        onErrorRef.current(data.error || "Generation failed");
      }
    } catch (err) {
      console.error("Continue generation error:", err);
      onErrorRef.current(err instanceof Error ? err.message : "Failed to continue");
    }
  }, [sessionId]);

  // SSE Streaming
  useEffect(() => {
    if (!useStreaming || isCompletedRef.current) return;

    const eventSource = new EventSource(
      `${BASE_URL}/world-creation/agent/generate/${sessionId}/stream`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);

        if (data.type === "done") {
          eventSource.close();
          if (!isCompletedRef.current) {
            isCompletedRef.current = true;
            onCompleteRef.current();
          }
          return;
        }

        if (data.type === "error") {
          eventSource.close();
          if (!isCompletedRef.current) {
            isCompletedRef.current = true;
            onErrorRef.current(data.error || "Generation failed");
          }
          return;
        }

        // Обновляем прогресс
        if (data.node && data.status === "completed") {
          const nodeKey = data.node as keyof GenerationProgressType;
          if (nodeKey in progress) {
            setProgress((prev) => ({
              ...prev,
              [nodeKey]: "completed",
            }));
          }
        }

        // Обработка HITL
        if (data.status === "waiting_for_input" && data.clarification) {
          eventSource.close();
          setClarificationRequest(data.clarification);
        }
      } catch (err) {
        console.error("Failed to parse SSE event:", err);
      }
    };

    eventSource.onerror = () => {
      console.warn("SSE connection error, falling back to polling");
      eventSource.close();
      setUseStreaming(false);
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId, useStreaming, progress]);

  // Fallback polling
  useEffect(() => {
    if (useStreaming || isCompletedRef.current || clarificationRequest) return;

    const fetchProgress = async () => {
      if (isCompletedRef.current) return;

      try {
        const res = await fetch(
          `${BASE_URL}/world-creation/agent/progress?sessionId=${sessionId}`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch progress");
        }
        const data: GenerationProgressType = await res.json();
        setProgress(data);

        const allCompleted = Object.values(data).every(
          (status) => status === "completed"
        );
        const anyFailed = Object.values(data).some(
          (status) => status === "failed"
        );

        if (allCompleted && !isCompletedRef.current) {
          isCompletedRef.current = true;
          onCompleteRef.current();
        } else if (anyFailed && !isCompletedRef.current) {
          isCompletedRef.current = true;
          const failedAgents = Object.entries(data)
            .filter(([, status]) => status === "failed")
            .map(([name]) => name);
          onErrorRef.current(`Ошибка генерации: ${failedAgents.join(", ")}`);
        }
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 1500);

    return () => clearInterval(interval);
  }, [sessionId, useStreaming, clarificationRequest]);

  const completedCount = Object.values(progress).filter(
    (s) => s === "completed"
  ).length;
  const totalCount = Object.keys(progress).length;

  // Показываем форму уточнения если есть запрос
  if (clarificationRequest) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
          minHeight: 400,
        }}
      >
        <ClarificationRenderer
          request={clarificationRequest}
          onSubmit={handleClarificationSubmit}
        />
      </Box>
    );
  }

  return (
    <Container>
      <Title variant="h5">
        Создание мира ({completedCount}/{totalCount})
      </Title>

      <AgentsGrid>
        {AGENTS.map((agent, index) => (
          <AgentCard key={agent.key} status={progress[agent.key]} index={index}>
            <IconWrapper status={progress[agent.key]}>
              {progress[agent.key] === "in_progress" && <Spinner />}
              <span>{agent.icon}</span>
            </IconWrapper>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color:
                  progress[agent.key] === "completed"
                    ? "#4ade80"
                    : progress[agent.key] === "in_progress"
                      ? "#a5b4fc"
                      : progress[agent.key] === "failed"
                        ? "#f87171"
                        : "#94a3b8",
              }}
            >
              {agent.label}
            </Typography>
            <StatusBadge status={progress[agent.key]}>
              {getStatusText(progress[agent.key])}
            </StatusBadge>
          </AgentCard>
        ))}
      </AgentsGrid>

      <Typography
        variant="body2"
        sx={{ mt: 4, color: "#64748b", textAlign: "center" }}
      >
        {useStreaming ? (
          <>
            Мир генерируется с использованием LangGraph.
            <br />
            Агенты могут задавать уточняющие вопросы.
          </>
        ) : (
          <>
            Мир генерируется параллельно несколькими агентами.
            <br />
            Это может занять около 20-30 секунд.
          </>
        )}
      </Typography>
    </Container>
  );
};
