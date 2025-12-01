import React from "react";
import { Box, type BoxProps } from "@mui/material";

interface GlassCardProps extends BoxProps {
  /** Сила размытия (px) */
  blur?: number;
  /** Прозрачность фона (0-1) */
  opacity?: number;
  /** Вариант стиля */
  variant?: "default" | "elevated" | "subtle";
}

/**
 * Glassmorphism карточка
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  blur = 10,
  opacity = 0.1,
  variant = "default",
  sx,
  ...props
}) => {
  const variantStyles = {
    default: {
      background: `rgba(255, 255, 255, ${opacity})`,
      border: "1px solid rgba(255, 255, 255, 0.2)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    },
    elevated: {
      background: `rgba(255, 255, 255, ${opacity + 0.05})`,
      border: "1px solid rgba(255, 255, 255, 0.3)",
      boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
    },
    subtle: {
      background: `rgba(255, 255, 255, ${opacity - 0.05})`,
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
    },
  };

  return (
    <Box
      sx={{
        ...variantStyles[variant],
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        borderRadius: 3,
        transition: "all 0.3s ease",
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

