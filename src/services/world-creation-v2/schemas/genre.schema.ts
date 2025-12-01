import { z } from "zod";

/**
 * Жанры сюжета (не сеттинга!)
 * Определяют тип истории/сюжета, а не мир
 */
export const GenreSchema = z.enum([
  "adventure",
  "mystery",
  "slice_of_life",
  "horror",
  "romance",
  "drama",
  "action",
  "thriller",
  "comedy",
  "survival",
  "political_intrigue",
  "heist",
]);

export type Genre = z.infer<typeof GenreSchema>;

export interface GenreMetadataItem {
  label: string;
  description: string;
  icon: string;
}

export const GenreMetadata: Record<Genre, GenreMetadataItem> = {
  adventure: {
    label: "Приключение",
    description: "Путешествия, квесты, исследования",
    icon: "compass",
  },
  mystery: {
    label: "Детектив",
    description: "Расследования, загадки, тайны",
    icon: "search",
  },
  slice_of_life: {
    label: "Повседневность",
    description: "Спокойная жизнь, отношения",
    icon: "coffee",
  },
  horror: {
    label: "Хоррор",
    description: "Страх, выживание, угрозы",
    icon: "ghost",
  },
  romance: {
    label: "Романтика",
    description: "Любовь, эмоциональные связи",
    icon: "heart",
  },
  drama: {
    label: "Драма",
    description: "Конфликты, развитие персонажей",
    icon: "theater",
  },
  action: {
    label: "Экшен",
    description: "Бои, погони, динамика",
    icon: "zap",
  },
  thriller: {
    label: "Триллер",
    description: "Напряжение, опасность, интриги",
    icon: "alert",
  },
  comedy: {
    label: "Комедия",
    description: "Юмор, абсурд, лёгкость",
    icon: "smile",
  },
  survival: {
    label: "Выживание",
    description: "Суровые условия, ресурсы",
    icon: "shield",
  },
  political_intrigue: {
    label: "Интриги",
    description: "Политика, заговоры, власть",
    icon: "crown",
  },
  heist: {
    label: "Ограбление",
    description: "Планирование, операции",
    icon: "key",
  },
};

/**
 * Жанр с метаданными
 */
export interface GenreWithMetadata extends GenreMetadataItem {
  id: Genre;
}

/**
 * Получить все жанры с метаданными
 */
export function getAllGenresWithMetadata(): GenreWithMetadata[] {
  return GenreSchema.options.map((genre) => ({
    id: genre,
    ...GenreMetadata[genre],
  }));
}
