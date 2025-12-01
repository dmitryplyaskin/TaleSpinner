import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, CircularProgress } from "@mui/material";
import {
  Explore,
  Search,
  LocalCafe,
  Brightness2,
  Favorite,
  TheaterComedy,
  FlashOn,
  Warning,
  SentimentSatisfied,
  Security,
  AccountBalance,
  Key,
} from "@mui/icons-material";
import { useUnit } from "effector-react";
import { GlassCard } from "../components";
import { selectGenre } from "../../model/events";
import { $genre, $isCreatingSession } from "../../model/stores";
import { fetchGenresFx } from "../../model/effects";
import type { Genre, GenreWithMetadata } from "../../model/types";

// Иконки для жанров
const GENRE_ICONS: Record<string, React.ReactNode> = {
  adventure: <Explore />,
  mystery: <Search />,
  slice_of_life: <LocalCafe />,
  horror: <Brightness2 />,
  romance: <Favorite />,
  drama: <TheaterComedy />,
  action: <FlashOn />,
  thriller: <Warning />,
  comedy: <SentimentSatisfied />,
  survival: <Security />,
  political_intrigue: <AccountBalance />,
  heist: <Key />,
};

/**
 * Шаг 1: Выбор жанра
 */
export const GenreStep: React.FC = () => {
  const [genres, setGenres] = useState<GenreWithMetadata[]>([]);
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);
  const { selectedGenre, isCreating } = useUnit({
    selectedGenre: $genre,
    isCreating: $isCreatingSession,
  });
  const handleSelectGenre = useUnit(selectGenre);

  useEffect(() => {
    // Загружаем жанры при монтировании
    fetchGenresFx()
      .then((result) => {
        setGenres(result.genres);
      })
      .catch(console.error)
      .finally(() => setIsLoadingGenres(false));
  }, []);

  if (isLoadingGenres) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
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
        Выберите жанр сюжета
      </Typography>

      <Typography
        variant="body1"
        sx={{
          textAlign: "center",
          mb: 4,
          color: "text.secondary",
          maxWidth: 600,
          mx: "auto",
        }}
      >
        Жанр определяет тип истории, а не сеттинг мира. Вы можете создать
        повседневный сюжет в фэнтези таверне или хоррор на космическом корабле.
      </Typography>

      <Grid container spacing={2}>
        {genres.map((genre, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={genre.id}>
            <GlassCard
              variant={selectedGenre === genre.id ? "elevated" : "default"}
              onClick={() => handleSelectGenre(genre.id as Genre)}
              sx={{
                p: 3,
                cursor: isCreating ? "wait" : "pointer",
                transition: "all 0.3s ease",
                animation: `slideIn 0.3s ease ${index * 0.05}s both`,
                border:
                  selectedGenre === genre.id
                    ? "2px solid rgba(233, 69, 96, 0.5)"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)",
                },
                opacity: isCreating ? 0.7 : 1,
                pointerEvents: isCreating ? "none" : "auto",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      selectedGenre === genre.id
                        ? "linear-gradient(135deg, #e94560 0%, #c23a51 100%)"
                        : "rgba(255, 255, 255, 0.1)",
                    color:
                      selectedGenre === genre.id
                        ? "#fff"
                        : "rgba(255, 255, 255, 0.7)",
                    transition: "all 0.3s ease",
                  }}
                >
                  {GENRE_ICONS[genre.id] || <Explore />}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                  }}
                >
                  {genre.label}
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  pl: 7,
                }}
              >
                {genre.description}
              </Typography>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      {isCreating && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
          }}
        >
          <CircularProgress size={24} />
          <Typography sx={{ ml: 2, color: "text.secondary" }}>
            Создание сессии...
          </Typography>
        </Box>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  );
};

