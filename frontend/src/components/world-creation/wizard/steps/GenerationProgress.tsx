import React, { useEffect, useState, useRef } from "react";
import { Box, Typography, keyframes, styled } from "@mui/material";
import { BASE_URL } from "../../../../const";
import type {
  GenerationProgress as GenerationProgressType,
  AgentStatus,
} from "../../../../types/world-creation";

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
})<{ status: AgentStatus; index: number }>(({ theme, status, index }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
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
})<{ status: AgentStatus }>(({ theme, status }) => ({
  fontSize: "0.75rem",
  padding: theme.spacing(0.25, 1),
  borderRadius: theme.spacing(0.5),
  marginTop: theme.spacing(0.5),
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

  // Use refs to avoid re-creating interval on callback changes
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const isCompletedRef = useRef(false);

  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  useEffect(() => {
    const fetchProgress = async () => {
      // Don't fetch if already completed
      if (isCompletedRef.current) {
        return;
      }

      try {
        const res = await fetch(
          `${BASE_URL}/world-creation/agent/progress?sessionId=${sessionId}`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch progress");
        }
        const data: GenerationProgressType = await res.json();
        setProgress(data);

        // Check if all agents are completed
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

    // Initial fetch
    fetchProgress();

    // Poll every 1.5 seconds
    const interval = setInterval(fetchProgress, 1500);

    return () => clearInterval(interval);
  }, [sessionId]);

  const completedCount = Object.values(progress).filter(
    (s) => s === "completed"
  ).length;
  const totalCount = Object.keys(progress).length;

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
        Мир генерируется параллельно несколькими агентами.
        <br />
        Это может занять около 20-30 секунд.
      </Typography>
    </Container>
  );
};
