import { StateGraph, END, MemorySaver } from "@langchain/langgraph";
import { WorldGenerationState, type WorldGenerationStateType } from "./state";
import {
  baseNode,
  factionsNode,
  locationsNode,
  racesNode,
  historyNode,
  magicNode,
  reviewNode,
  refineNode,
} from "./nodes";

// Условная функция для review
function shouldRefine(state: WorldGenerationStateType): "refineWorld" | "end" {
  // Максимум 2 итерации рефайнмента
  if (state.iterationCount >= 2) {
    return "end";
  }

  // Если есть критические проблемы — рефайним
  const hasCriticalIssues = state.reviewIssues.some(
    (issue) => issue.severity === "critical"
  );

  if (!state.isConsistent && hasCriticalIssues) {
    return "refineWorld";
  }

  return "end";
}

// Создание графа
export function createWorldGenerationGraph(checkpointer?: MemorySaver) {
  const workflow = new StateGraph(WorldGenerationState)
    // Добавляем узлы
    .addNode("generateBase", baseNode)
    .addNode("generateFactions", factionsNode)
    .addNode("generateLocations", locationsNode)
    .addNode("generateRaces", racesNode)
    .addNode("generateHistory", historyNode)
    .addNode("generateMagic", magicNode)
    .addNode("reviewWorld", reviewNode)
    .addNode("refineWorld", refineNode)

    // Edges: START -> generateBase
    .addEdge("__start__", "generateBase")

    // generateBase -> параллельный запуск factions, locations, races
    .addEdge("generateBase", "generateFactions")
    .addEdge("generateBase", "generateLocations")
    .addEdge("generateBase", "generateRaces")

    // factions, locations, races -> history (ждёт всех)
    .addEdge("generateFactions", "generateHistory")
    .addEdge("generateLocations", "generateHistory")
    .addEdge("generateRaces", "generateHistory")

    // history -> magic
    .addEdge("generateHistory", "generateMagic")

    // magic -> review
    .addEdge("generateMagic", "reviewWorld")

    // review -> conditional (refine или end)
    .addConditionalEdges("reviewWorld", shouldRefine, {
      refine: "refineWorld",
      end: END,
    })

    // refine -> review (цикл)
    .addEdge("refineWorld", "reviewWorld");

  if (checkpointer) {
    return workflow.compile({ checkpointer });
  }

  return workflow.compile();
}

// Singleton instance без checkpointer (для простых вызовов)
let graphInstance: ReturnType<typeof createWorldGenerationGraph> | null = null;

export function getWorldGenerationGraph(checkpointer?: MemorySaver) {
  if (checkpointer) {
    // Если передан checkpointer, создаём новый граф с ним
    return createWorldGenerationGraph(checkpointer);
  }

  if (!graphInstance) {
    graphInstance = createWorldGenerationGraph();
  }
  return graphInstance;
}

// Тип для результата графа
export type WorldGenerationGraphResult = Awaited<
  ReturnType<ReturnType<typeof createWorldGenerationGraph>["invoke"]>
>;

