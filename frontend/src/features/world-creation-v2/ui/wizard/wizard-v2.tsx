import React from "react";
import {
  Box,
  Container,
  IconButton,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { ArrowBack, Warning } from "@mui/icons-material";
import { useUnit } from "effector-react";
import { StepIndicator, GlassCard } from "../components";
import {
  GenreStep,
  InputStep,
  ArchitectStep,
  SkeletonStep,
  GenerationStep,
  ReviewStep,
} from "../steps";
import {
  $step,
  $sessionId,
  $error,
  $exitDialogOpen,
} from "../../model/stores";
import {
  openExitDialog,
  closeExitDialog,
  resetWizard,
  clearError,
} from "../../model/events";

/**
 * Основной компонент Wizard V2
 */
export const WizardV2: React.FC = () => {
  const { step, sessionId, error, exitDialogOpen } = useUnit({
    step: $step,
    sessionId: $sessionId,
    error: $error,
    exitDialogOpen: $exitDialogOpen,
  });

  const handleOpenExitDialog = useUnit(openExitDialog);
  const handleCloseExitDialog = useUnit(closeExitDialog);
  const handleResetWizard = useUnit(resetWizard);
  const handleClearError = useUnit(clearError);

  const handleExitClick = () => {
    if (step === "genre" && !sessionId) {
      // Просто закрываем без подтверждения
      window.history.back();
      return;
    }
    handleOpenExitDialog();
  };

  const handleExitConfirm = () => {
    handleCloseExitDialog();
    handleResetWizard();
    window.history.back();
  };

  const renderStep = () => {
    switch (step) {
      case "genre":
        return <GenreStep />;
      case "input":
        return <InputStep />;
      case "architect":
        return <ArchitectStep />;
      case "skeleton_review":
        return <SkeletonStep />;
      case "generation":
        return <GenerationStep />;
      case "review":
        return <ReviewStep />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
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
            sx={{
              color: "text.primary",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderColor: "rgba(255, 255, 255, 0.3)",
              },
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Создание мира
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Новая версия мастера создания миров
            </Typography>
          </Box>
        </Box>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            onClose={handleClearError}
            sx={{
              mb: 3,
              backgroundColor: "rgba(211, 47, 47, 0.1)",
              color: "error.main",
              "& .MuiAlert-icon": {
                color: "error.main",
              },
            }}
          >
            {error}
          </Alert>
        )}

        {/* Content */}
        <GlassCard
          sx={{
            p: 4,
            minHeight: "60vh",
          }}
        >
          {renderStep()}
        </GlassCard>

        {/* Exit Confirmation Dialog */}
        <Dialog
          open={exitDialogOpen}
          onClose={handleCloseExitDialog}
          PaperProps={{
            sx: {
              backgroundColor: "#1a1a2e",
              backgroundImage: "none",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "warning.main",
            }}
          >
            <Warning />
            Выйти из создания мира?
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: "text.secondary" }}>
              Весь прогресс создания мира будет потерян. Вы уверены, что хотите
              выйти?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCloseExitDialog}
              variant="outlined"
              sx={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "text.primary",
              }}
            >
              Остаться
            </Button>
            <Button
              onClick={handleExitConfirm}
              variant="contained"
              color="warning"
            >
              Выйти
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

