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
import { MainLayout, Sidebar } from "../../../../components/layout";
import { goToWelcome, goToWorldPreparation } from "../../../../model/app-navigation";

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
      goToWelcome();
      return;
    }
    handleOpenExitDialog();
  };

  const handleExitConfirm = () => {
    handleCloseExitDialog();
    handleResetWizard();
    goToWelcome();
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
    <MainLayout
      sidebar={<Sidebar onSelectWorld={(id) => goToWorldPreparation(id)} />}
      showSidebar={true}
      showRightPanel={false}
    >
      <Box sx={{ height: "100%", overflowY: "auto" }}>
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

          {/* Step Indicator */}
          <StepIndicator currentStep={step} />

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={handleClearError}>
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
                Весь прогресс создания мира будет потерян. Вы уверены, что хотите
                выйти?
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleCloseExitDialog} variant="outlined">
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
      </Box>
    </MainLayout>
  );
};

