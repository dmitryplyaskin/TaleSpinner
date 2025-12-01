import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Divider,
} from "@mui/material";
import { ExpandMore, Save, Edit, Check } from "@mui/icons-material";
import { useUnit } from "effector-react";
import { GlassCard } from "../components";
import { updateWorldElement } from "../../model/events";
import {
  $generatedWorld,
  $skeleton,
  $sessionId,
  $isSaving,
} from "../../model/stores";
import { saveWorldFx } from "../../model/effects";
import type { DynamicWorldElement, WorldElementCategory } from "../../model/types";

/**
 * Редактор одного элемента
 */
const ElementEditor: React.FC<{
  element: DynamicWorldElement;
  categoryId: string;
  onChange: (field: string, value: string) => void;
}> = ({ element, categoryId, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <GlassCard variant="subtle" sx={{ p: 2, mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 2,
        }}
      >
        {isEditing ? (
          <TextField
            value={element.name}
            onChange={(e) => onChange("name", e.target.value)}
            variant="standard"
            sx={{
              flex: 1,
              "& .MuiInputBase-input": {
                fontSize: "1.1rem",
                fontWeight: 600,
              },
            }}
          />
        ) : (
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {element.name}
          </Typography>
        )}

        <Button
          size="small"
          onClick={() => setIsEditing(!isEditing)}
          startIcon={isEditing ? <Check /> : <Edit />}
          sx={{ ml: 2 }}
        >
          {isEditing ? "Готово" : "Редактировать"}
        </Button>
      </Box>

      {isEditing ? (
        <TextField
          fullWidth
          multiline
          rows={3}
          value={element.description}
          onChange={(e) => onChange("description", e.target.value)}
          label="Описание"
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
        />
      ) : (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 2, whiteSpace: "pre-wrap" }}
        >
          {element.description}
        </Typography>
      )}

      {/* Динамические поля */}
      {Object.entries(element.fields).length > 0 && (
        <>
          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)" }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {Object.entries(element.fields).map(([key, value]) => (
              <Box key={key}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    textTransform: "capitalize",
                  }}
                >
                  {key.replace(/_/g, " ")}
                </Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    multiline={typeof value === "string" && value.length > 100}
                    value={Array.isArray(value) ? value.join(", ") : value}
                    onChange={(e) => onChange(key, e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {Array.isArray(value) ? value.join(", ") : value}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </>
      )}
    </GlassCard>
  );
};

/**
 * Категория элементов
 */
const CategorySection: React.FC<{
  category: WorldElementCategory;
  onElementChange: (elementId: string, field: string, value: string) => void;
}> = ({ category, onElementChange }) => {
  return (
    <Accordion
      defaultExpanded
      sx={{
        backgroundColor: "transparent",
        backgroundImage: "none",
        boxShadow: "none",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore sx={{ color: "text.primary" }} />}
        sx={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderRadius: 2,
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {category.categoryName}
          </Typography>
          <Chip
            label={`${category.elements.length} элементов`}
            size="small"
            sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0, pt: 2 }}>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mb: 3 }}
        >
          {category.categoryDescription}
        </Typography>
        {category.elements.map((element) => (
          <ElementEditor
            key={element.id}
            element={element}
            categoryId={category.categoryId}
            onChange={(field, value) => onElementChange(element.id, field, value)}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

/**
 * Шаг 5: Финальный просмотр и редактирование
 */
export const ReviewStep: React.FC = () => {
  const { world, skeleton, sessionId, isSaving } = useUnit({
    world: $generatedWorld,
    skeleton: $skeleton,
    sessionId: $sessionId,
    isSaving: $isSaving,
  });
  const handleUpdateElement = useUnit(updateWorldElement);

  const handleSave = () => {
    if (!sessionId || !world) return;
    saveWorldFx({ sessionId, editedWorld: world });
  };

  if (!world || !skeleton) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: "fadeIn 0.5s ease" }}>
      <Typography
        variant="h4"
        sx={{
          textAlign: "center",
          mb: 2,
          fontWeight: 600,
          background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {skeleton.name}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          textAlign: "center",
          mb: 4,
          color: "text.secondary",
        }}
      >
        Ваш мир готов! Просмотрите и отредактируйте детали при необходимости.
      </Typography>

      {/* Метаданные */}
      <GlassCard sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <Chip label={skeleton.setting} variant="outlined" />
          <Chip label={skeleton.era} variant="outlined" />
          <Chip label={skeleton.tone} variant="outlined" />
        </Box>
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
          {skeleton.worldPrimer}
        </Typography>
      </GlassCard>

      {/* Категории элементов */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {world.categories.map((category) => (
          <GlassCard key={category.categoryId} sx={{ p: 3 }}>
            <CategorySection
              category={category}
              onElementChange={(elementId, field, value) =>
                handleUpdateElement({
                  categoryId: category.categoryId,
                  elementId,
                  field,
                  value,
                })
              }
            />
          </GlassCard>
        ))}
      </Box>

      {/* Статистика */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 4,
          mt: 4,
          mb: 4,
          color: "text.secondary",
        }}
      >
        <Typography variant="body2">
          Всего элементов: {world.metadata.totalElements}
        </Typography>
        <Typography variant="body2">
          Категорий: {world.categories.length}
        </Typography>
      </Box>

      {/* Кнопка сохранения */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={isSaving}
          startIcon={
            isSaving ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Save />
            )
          }
          sx={{
            background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
            px: 6,
            py: 1.5,
            "&:hover": {
              background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
            },
          }}
        >
          {isSaving ? "Сохранение..." : "Сохранить мир"}
        </Button>
      </Box>

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

