import React, { useState } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Alert,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Container,
} from "@mui/material";
import { ArrowBack, Warning } from "@mui/icons-material";
import { SettingSelection } from "./steps/SettingSelection";
import { WorldInput } from "./steps/WorldInput";
import { QuestionForm } from "./steps/QuestionForm";
import { WorldReview } from "./steps/WorldReview";
import { BASE_URL } from "../../../const";
import { goToWelcome } from "../../../model/app-navigation";
import type { WorldData } from "../../../types/world-creation";

const steps = ["Выбор сеттинга", "Описание мира", "Уточнение деталей", "Проверка и сохранение"];

export const Wizard = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [setting, setSetting] = useState<string>("fantasy");
  const [userInput, setUserInput] = useState("");
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleStartSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BASE_URL}/world-creation/agent/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setting }),
      });

      if (!res.ok) {
        throw new Error("Не удалось начать сессию");
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      handleNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось начать сессию");
    } finally {
      setLoading(false);
    }
  };

  const handleExitClick = () => {
    // Если пользователь ещё не начал вводить данные, выходим сразу
    if (activeStep === 0 && !sessionId) {
      goToWelcome();
      return;
    }
    setExitDialogOpen(true);
  };

  const handleExitConfirm = () => {
    setExitDialogOpen(false);
    goToWelcome();
  };

  const handleExitCancel = () => {
    setExitDialogOpen(false);
  };

  const handleWorldSaved = () => {
    goToWelcome();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 4,
        }}
      >
        <IconButton
          onClick={handleExitClick}
          size="large"
          sx={{
            border: "1px solid",
            borderColor: "divider",
            "&:hover": {
              borderColor: "warning.main",
              bgcolor: "rgba(255, 143, 0, 0.08)",
            },
          }}
        >
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Создание мира
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Пошаговый мастер создания игрового мира
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Stepper
        activeStep={activeStep}
        sx={{
          mb: 4,
          "& .MuiStepLabel-label": {
            fontSize: "0.9rem",
          },
          "& .MuiStepIcon-root.Mui-active": {
            color: "primary.main",
          },
          "& .MuiStepIcon-root.Mui-completed": {
            color: "success.main",
          },
        }}
      >
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel
              sx={{
                "& .MuiStepLabel-label.Mui-active": {
                  color: "primary.main",
                  fontWeight: 600,
                },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Content */}
      <Paper
        sx={{
          p: 4,
          minHeight: "60vh",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #d4af37 0%, #8b4789 50%, #4a90a4 100%)",
          },
        }}
      >
        {activeStep === 0 && (
          <SettingSelection
            selected={setting}
            onSelect={setSetting}
            onNext={handleStartSession}
            loading={loading}
          />
        )}
        {activeStep === 1 && (
          <WorldInput
            value={userInput}
            onChange={setUserInput}
            onNext={handleNext}
          />
        )}
        {activeStep === 2 && sessionId && (
          <QuestionForm
            sessionId={sessionId}
            initialInput={userInput}
            onComplete={(data) => {
              setWorldData(data);
              handleNext();
            }}
            onError={setError}
          />
        )}
        {activeStep === 3 && worldData && sessionId && (
          <WorldReview
            data={worldData}
            sessionId={sessionId}
            onSave={handleWorldSaved}
            onError={setError}
          />
        )}
      </Paper>

      {/* Exit Confirmation Dialog */}
      <Dialog
        open={exitDialogOpen}
        onClose={handleExitCancel}
        PaperProps={{
          sx: {
            borderTop: "4px solid",
            borderColor: "warning.main",
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="warning" />
          Выйти из создания мира?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Весь прогресс создания мира будет потерян. Вы уверены, что хотите выйти?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleExitCancel} variant="outlined">
            Остаться
          </Button>
          <Button
            onClick={handleExitConfirm}
            variant="contained"
            color="warning"
            sx={{
              bgcolor: "warning.main",
              color: "warning.contrastText",
              "&:hover": {
                bgcolor: "warning.dark",
              },
            }}
          >
            Выйти
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
