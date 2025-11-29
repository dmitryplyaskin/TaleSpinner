import React, { useState, useEffect } from 'react';
import { useUnit } from 'effector-react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
  FormGroup,
  Divider,
} from '@mui/material';
import {
  $clarificationRequest,
  $sessionId,
  $isContinuing,
  continueGenerationFx,
} from '../../model';
import type { ClarificationField, ClarificationOption } from '@shared/types/human-in-the-loop';

export const QuestionForm: React.FC = () => {
  const request = useUnit($clarificationRequest);
  const sessionId = useUnit($sessionId);
  const isSubmitting = useUnit($isContinuing);
  const handleContinue = useUnit(continueGenerationFx);

  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Initialize default values
  useEffect(() => {
    if (request) {
      const initialAnswers: Record<string, any> = {};
      request.fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          initialAnswers[field.id] = field.defaultValue;
        } else if (field.type === 'multiselect') {
          initialAnswers[field.id] = [];
        }
      });
      setAnswers(initialAnswers);
    }
  }, [request]);

  if (!request) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Waiting for agent...</Typography>
      </Box>
    );
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleMultiSelectChange = (fieldId: string, value: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = (prev[fieldId] as string[]) || [];
      if (checked) {
        return { ...prev, [fieldId]: [...current, value] };
      } else {
        return { ...prev, [fieldId]: current.filter((v) => v !== value) };
      }
    });
  };

  const handleSubmit = () => {
    if (sessionId && request) {
      handleContinue({
        sessionId,
        response: {
          requestId: request.id,
          skipped: false,
          answers,
        },
      });
    }
  };

  const handleSkip = () => {
    if (sessionId && request) {
      handleContinue({
        sessionId,
        response: {
          requestId: request.id,
          skipped: true,
          answers: {},
        },
      });
    }
  };

  const renderField = (field: ClarificationField) => {
    switch (field.type) {
      case 'radio':
        return (
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">{field.label}</FormLabel>
            <RadioGroup
              value={answers[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            >
              {field.options?.map((opt: ClarificationOption) => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">{opt.label}</Typography>
                      {opt.description && (
                        <Typography variant="caption" color="text.secondary">
                          {opt.description}
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{ mb: 1, alignItems: 'flex-start' }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'multiselect':
        return (
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">{field.label}</FormLabel>
            <FormGroup>
              {field.options?.map((opt: ClarificationOption) => (
                <FormControlLabel
                  key={opt.value}
                  control={
                    <Checkbox
                      checked={(answers[field.id] as string[] || []).includes(opt.value)}
                      onChange={(e) => handleMultiSelectChange(field.id, opt.value, e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">{opt.label}</Typography>
                      {opt.description && (
                        <Typography variant="caption" color="text.secondary">
                          {opt.description}
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{ mb: 1, alignItems: 'flex-start' }}
                />
              ))}
            </FormGroup>
          </FormControl>
        );

      case 'textarea':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label={field.label}
            placeholder={field.placeholder}
            value={answers[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            helperText={field.description}
          />
        );

      case 'text':
      default:
        return (
          <TextField
            fullWidth
            label={field.label}
            placeholder={field.placeholder}
            value={answers[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            helperText={field.description}
          />
        );
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 800, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom color="primary">
            {request.context.title}
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
            {request.context.description}
          </Typography>
          {request.context.reason && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {request.context.reason}
            </Alert>
          )}
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {request.fields.map((field) => (
            <Box key={field.id}>
              {renderField(field)}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
          {request.options.allowSkip && (
            <Button variant="outlined" onClick={handleSkip} disabled={isSubmitting}>
              {request.options.skipLabel || 'Skip'}
            </Button>
          )}
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : (request.options.submitLabel || 'Submit')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};




