import { LLMService, LLMResponseFormat } from "@core/services/llm.service";
import { LLMOutputLanguage } from "@shared/types/settings";
import {
  ArchitectResponseSchema,
  ArchitectResponse,
} from "./schemas";

export const architectResponseFormat: LLMResponseFormat = {
  schema: ArchitectResponseSchema,
  name: "world_architect_analysis",
};

export class ArchitectAgent {
  private llm: LLMService;

  constructor() {
    this.llm = LLMService.getInstance();
  }

  public async analyze(
    userInput: string,
    currentKnownInfo: string[],
    setting: string,
    outputLanguage: LLMOutputLanguage = "ru"
  ): Promise<ArchitectResponse> {
    const isRussian = outputLanguage === "ru";

    const systemMessage = isRussian
      ? `Ты — Архитектор Миров, эксперт по созданию вселенных для книг и игр. 
Твоя задача — проанализировать идею пользователя и либо запросить уточнения, либо спроектировать "Скелет" мира.
ОБЯЗАТЕЛЬНО генерируй ВСЕ текстовые ответы на РУССКОМ языке.`
      : `You are the World Architect, an expert in creating universes for books and games.
Your task is to analyze the user's idea and either request clarifications or design a "Skeleton" of the world.
Generate ALL text responses in ENGLISH language.`;

    const prompt = isRussian
      ? `Проанализируй ввод пользователя для сеттинга "${setting}".

Текущая известная информация:
${JSON.stringify(currentKnownInfo)}

Ввод пользователя:
"${userInput}"

Твои задачи:
1. Оцени полноту информации. Хватает ли данных для создания целостного концепта?
2. Определи КОНФИГУРАЦИЮ генерации (какие модули нужны):
   - Фракции (политика, гильдии)? (Нет для повседневности/выживания одиночки)
   - Магия/Технологии?
   - Расы? (Нет для реализма)
   - История?
   - Локации? (Почти всегда да)
3. ЕСЛИ информации МАЛО:
   - Сгенерируй 2-4 уточняющих вопроса.
   - Для каждого вопроса ПРЕДЛОЖИ 2-3 варианта ответа (options), которые подходят по контексту.
   - Установи 'is_ready' в false.
   - Не генерируй skeleton.
4. ЕСЛИ информации ДОСТАТОЧНО (или пользователь просит "решай сам"):
   - Создай 'skeleton' (Название, Синопсис, Тон).
   - Заполни 'config' на основе жанра и описания.
   - Установи 'is_ready' в true.
   - Не генерируй questions.

Примеры логики конфига:
- "Школа в Токио, романтика": hasMagic=false, hasRaces=false, hasFactions=false (или true если школьные клубы важны), hasLocations=true.
- "Киберпанк детектив": hasMagic=false (или true если это техно-магия), hasRaces=false (если нет андроидов/мутантов), hasFactions=true (корпорации).
- "Высокое фэнтези": hasMagic=true, hasRaces=true, hasFactions=true.

Верни JSON.`
      : `Analyze the user input for the setting "${setting}".

Current Known Information:
${JSON.stringify(currentKnownInfo)}

User Input:
"${userInput}"

Your Tasks:
1. Evaluate information completeness. Is there enough data for a cohesive concept?
2. Determine GENERATION CONFIGURATION (which modules are needed):
   - Factions (politics, guilds)? (No for slice-of-life/solo survival)
   - Magic/Tech?
   - Races? (No for realism)
   - History?
   - Locations? (Almost always yes)
3. IF information is INSUFFICIENT:
   - Generate 2-4 clarifying questions.
   - For each question, SUGGEST 2-3 answer options that fit the context.
   - Set 'is_ready' to false.
   - Do not generate skeleton.
4. IF information is SUFFICIENT (or user says "you decide"):
   - Create 'skeleton' (Title, Synopsis, Tone).
   - Fill 'config' based on genre and description.
   - Set 'is_ready' to true.
   - Do not generate questions.

Config Logic Examples:
- "School in Tokyo, romance": hasMagic=false, hasRaces=false, hasFactions=false, hasLocations=true.
- "Cyberpunk detective": hasMagic=false (tech?), hasRaces=false (unless androids), hasFactions=true (corps).
- "High Fantasy": hasMagic=true, hasRaces=true, hasFactions=true.

Return JSON.`;

    return (await this.llm.call({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      responseFormat: architectResponseFormat,
    })) as ArchitectResponse;
  }
}
