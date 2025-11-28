import React, { useState, useEffect } from 'react';
import { useUnit } from 'effector-react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Divider,
  FormGroup,
  FormControlLabel,
  Switch,
  TextField,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import {
  $clarificationRequest,
  $sessionId,
  $isContinuing,
  continueGenerationFx,
} from '../../model';

interface ModuleConfig {
  hasFactions: boolean;
  hasLocations: boolean;
  hasRaces: boolean;
  hasHistory: boolean;
  hasMagic: boolean;
  hasCharacters: boolean;
}

const MODULE_LABELS: Record<keyof ModuleConfig, { label: string; description: string }> = {
  hasFactions: { label: 'Фракции и Политика', description: 'Гильдии, ордена, правительства' },
  hasLocations: { label: 'Локации и География', description: 'Города, руины, ландшафт' },
  hasRaces: { label: 'Расы и Виды', description: 'Эльфы, пришельцы, мутанты' },
  hasHistory: { label: 'История и Хронология', description: 'Важные события прошлого' },
  hasMagic: { label: 'Магия и Технологии', description: 'Магическая система или тех-уровень' },
  hasCharacters: { label: 'Ключевые Персонажи', description: 'Важные NPC' },
};

export const SkeletonPreview: React.FC = () => {
  const request = useUnit($clarificationRequest);
  const sessionId = useUnit($sessionId);
  const isSubmitting = useUnit($isContinuing);
  const handleContinue = useUnit(continueGenerationFx);

  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');

  // Parse skeleton from request
  const skeleton = React.useMemo(() => {
    if (!request) return null;
    
    // Extract skeleton info from description (it's in markdown format)
    const description = request.context.description;
    const titleMatch = description.match(/\*\*(.+?)\*\*/);
    const title = titleMatch ? titleMatch[1] : 'Untitled World';
    
    // Extract modules from defaults
    const modulesField = request.fields.find(f => f.id === 'modules');
    const defaultModules = (modulesField?.defaultValue as string[]) || [];
    
    return {
      title,
      description,
      modules: defaultModules,
    };
  }, [request]);

  // Initialize selected modules from defaults
  useEffect(() => {
    if (skeleton) {
      setSelectedModules(skeleton.modules);
    }
  }, [skeleton]);

  if (!request || request.context.currentNode !== 'architect') {
    return null;
  }

  const handleModuleToggle = (moduleKey: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((m) => m !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const handleApprove = () => {
    if (sessionId && request) {
      handleContinue({
        sessionId,
        response: {
          requestId: request.id,
          skipped: false,
          answers: {
            modules: selectedModules,
            feedback: feedback.trim(),
            action: 'approve',
          },
        },
      });
    }
  };

  const handleRefine = () => {
    if (sessionId && request) {
      handleContinue({
        sessionId,
        response: {
          requestId: request.id,
          skipped: false,
          answers: {
            modules: selectedModules,
            feedback: feedback.trim(),
            action: 'refine',
          },
        },
      });
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Paper elevation={4} sx={{ p: 4, bgcolor: 'background.paper' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircleIcon fontSize="large" />
            Паспорт Мира
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Проверьте концепцию и выберите модули для генерации
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Skeleton Info */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            {skeleton?.title}
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', mb: 2 }}>
            {request.context.description.replace(/\*\*/g, '')}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Module Selection */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon /> Модули для генерации
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Выберите, какие аспекты мира вы хотите сгенерировать
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <FormGroup>
              {Object.entries(MODULE_LABELS).map(([key, { label, description }]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      checked={selectedModules.includes(key)}
                      onChange={() => handleModuleToggle(key)}
                      disabled={isSubmitting}
                    />
                  }
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body1">{label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {description}
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1, alignItems: 'flex-start' }}
                />
              ))}
            </FormGroup>
          </Paper>

          {selectedModules.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Выберите хотя бы один модуль для генерации!
            </Alert>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Feedback */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Комментарии и Правки (опционально)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Например: 'Сделай мир более мрачным' или 'Добавь больше политических интриг'"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={isSubmitting}
            helperText="Оставьте пустым, если всё устраивает"
          />
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            size="large"
            onClick={handleRefine}
            disabled={isSubmitting}
            startIcon={<EditIcon />}
          >
            Переделать Скелет
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleApprove}
            disabled={isSubmitting || selectedModules.length === 0}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {isSubmitting ? 'Запуск генерации...' : 'Утвердить и Генерировать'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
