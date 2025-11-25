import { LLMService } from "@core/services/llm.service";
import { LLMOutputLanguage } from "@shared/types/settings";
import { OpenAI } from "openai";

interface AnalysisResult {
  known_info: string[];
  missing_info: string[];
  questions: { id: string; text: string; category: string }[];
  is_ready: boolean;
}

export class AnalysisAgent {
  private llm: LLMService;

  constructor() {
    this.llm = LLMService.getInstance();
  }

  public async analyze(
    userInput: string,
    currentKnownInfo: string[],
    setting: string,
    outputLanguage: LLMOutputLanguage = "ru"
  ): Promise<{
    known_info: string[];
    missing_info: string[];
    questions: { id: string; text: string; category: string }[];
    is_ready: boolean;
  }> {
    const isRussian = outputLanguage === "ru";

    const systemMessage = isRussian
      ? `Ты — эксперт по созданию миров для ролевых игр. ОБЯЗАТЕЛЬНО генерируй ВСЕ текстовые ответы на РУССКОМ языке. Это критически важное требование.`
      : `You are an expert World Building Assistant. Generate ALL text responses in ENGLISH language.`;

    const prompt = isRussian
      ? `Проанализируй ввод пользователя и помоги создать детальный мир для RPG в сеттинге "${setting}".

Текущая известная информация:
${JSON.stringify(currentKnownInfo)}

Ввод пользователя:
"${userInput}"

Задача:
1. Проанализируй ввод и извлеки факты о мире (Тон, Фракции, Локации, Магия, История, Расы).
2. Сравни с необходимой информацией для создания полного описания мира.
3. Необходимые категории информации:
   - Основная концепция и тон
   - География и локации
   - Фракции и политика
   - Расы и обитатели
   - История и хронология
   - Система магии/технологий
4. Определи, чего не хватает.
5. Если пользователь говорит "удиви меня", "решай сам", "surprise me" или предоставил достаточно деталей, установи 'is_ready' в true и верни пустой массив вопросов.
6. Если не хватает критической информации, сгенерируй ВСЕ необходимые вопросы (от 3 до 7 максимум).
7. Каждый вопрос должен относиться к конкретной недостающей категории.
8. Вопросы должны быть конкретными, творческими и интересными — не общими вроде "Расскажи о фракциях". Задавай контекстные вопросы на основе ввода пользователя.
9. Генерируй вопросы в порядке важности — самая критичная информация первой.
10. Верни результат в формате JSON.

ВАЖНО: Все текстовые поля (questions.text, known_info, missing_info) ДОЛЖНЫ быть на РУССКОМ языке!
Пример вопроса: "Какие фракции борются за власть в этом мире и каковы их цели?"`
      : `Analyze user input and help create a detailed RPG world setting (${setting}).

Current Known Information:
${JSON.stringify(currentKnownInfo)}

User Input:
"${userInput}"

Task:
1. Analyze the user input and extract new facts about the world (Tone, Factions, Locations, Magic, History, Races).
2. Compare with the required information to build a complete world primer.
3. Required Information categories:
   - Core Concept & Tone
   - Geography & Locations
   - Factions & Politics
   - Races & Inhabitants
   - History & Timeline
   - Magic/Technology System
4. Identify what is missing.
5. If the user says "surprise me", "you decide" or provides enough detail for a solid foundation, mark 'is_ready' as true and return empty questions array.
6. If critical information is missing, generate ALL questions needed to fill the gaps (between 3 and 7 questions maximum).
7. Each question should target a specific missing category and be answerable independently.
8. Questions should be specific, creative, and engaging - not generic like "Tell me about factions". Ask contextual questions based on the user's input.
9. Generate questions in order of importance - most critical information first.
10. Return the result in JSON format.`;

    const schemaDescriptions = isRussian
      ? {
          known_info:
            "Список фактов о мире, собранных на данный момент (на русском языке).",
          missing_info:
            "Список недостающих категорий или деталей (на русском языке).",
          questions:
            "Список вопросов для пользователя на русском языке, или пустой массив если информации достаточно.",
          text: "Текст вопроса на русском языке",
        }
      : {
          known_info: "List of facts gathered so far.",
          missing_info: "List of categories or specific details missing.",
          questions:
            "List of questions to ask the user, or empty array if ready.",
          text: "Question text",
        };

    const responseFormat: OpenAI.ResponseFormatJSONSchema = {
      type: "json_schema",
      json_schema: {
        name: "world_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            known_info: {
              type: "array",
              items: { type: "string" },
              description: schemaDescriptions.known_info,
            },
            missing_info: {
              type: "array",
              items: { type: "string" },
              description: schemaDescriptions.missing_info,
            },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  text: {
                    type: "string",
                    description: schemaDescriptions.text,
                  },
                  category: { type: "string" },
                },
                required: ["id", "text", "category"],
                additionalProperties: false,
              },
              description: schemaDescriptions.questions,
            },
            is_ready: {
              type: "boolean",
              description:
                "True if enough info is gathered or user opted for auto-generation.",
            },
          },
          required: ["known_info", "missing_info", "questions", "is_ready"],
          additionalProperties: false,
        },
      },
    };

    return (await this.llm.call({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      responseFormat,
    })) as AnalysisResult;
  }
}
