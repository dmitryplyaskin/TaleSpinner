import { StateGraph, END, MemorySaver } from "@langchain/langgraph";
import { WorldCreationV2State, type WorldCreationV2StateType } from "./state";
import { architectNode, elementsNode } from "./nodes";

/**
 * Условие для перехода после архитектора
 */
function shouldContinueArchitect(
  state: WorldCreationV2StateType
): "architect" | "waitForApproval" {
  // Если скелет готов - ждём одобрения
  if (state.skeleton && state.currentPhase === "skeleton_ready") {
    return "waitForApproval";
  }

  // Иначе продолжаем работу архитектора
  return "architect";
}

/**
 * Node ожидания одобрения скелета
 */
async function waitForApprovalNode(
  state: WorldCreationV2StateType
): Promise<Partial<WorldCreationV2StateType>> {
  // Этот node просто маркер - реальное ожидание происходит на уровне сервиса
  console.log("[WaitForApproval] Skeleton ready, waiting for user approval");
  return {
    currentPhase: "waiting_for_approval",
  };
}

/**
 * Условие для перехода после одобрения
 */
function shouldContinueAfterApproval(
  state: WorldCreationV2StateType
): "generateElements" | "waitForApproval" {
  if (state.skeletonApproved) {
    return "generateElements";
  }
  return "waitForApproval";
}

/**
 * Условие для перехода после генерации элементов
 */
function shouldContinueElements(
  state: WorldCreationV2StateType
): "generateElements" | "end" {
  // Если есть ошибка - завершаем
  if (state.currentPhase === "error") {
    return "end";
  }

  // Проверяем, все ли элементы сгенерированы
  const generatedTypes = state.generatedCategories.map((c) => c.categoryId);
  const allGenerated = state.elementsToGenerate.every((e) =>
    generatedTypes.includes(e)
  );

  if (allGenerated) {
    console.log("[Graph] All elements generated, finishing");
    return "end";
  }

  return "generateElements";
}

/**
 * Создать граф генерации мира v2
 */
export function createWorldCreationV2Graph(checkpointer: MemorySaver) {
  const workflow = new StateGraph(WorldCreationV2State)
    // Ноды
    .addNode("architect", architectNode)
    .addNode("waitForApproval", waitForApprovalNode)
    .addNode("generateElements", elementsNode)

    // Начало -> Архитектор
    .addEdge("__start__", "architect")

    // Архитектор -> условный переход
    .addConditionalEdges("architect", shouldContinueArchitect, {
      architect: "architect",
      waitForApproval: "waitForApproval",
    })

    // Ожидание одобрения -> условный переход
    .addConditionalEdges("waitForApproval", shouldContinueAfterApproval, {
      waitForApproval: "waitForApproval",
      generateElements: "generateElements",
    })

    // Генерация элементов -> условный переход
    .addConditionalEdges("generateElements", shouldContinueElements, {
      generateElements: "generateElements",
      end: END,
    });

  return workflow.compile({ checkpointer });
}

/**
 * Тип скомпилированного графа
 */
export type WorldCreationV2Graph = ReturnType<typeof createWorldCreationV2Graph>;

/**
 * Тип результата выполнения графа
 */
export type WorldCreationV2GraphResult = Awaited<
  ReturnType<WorldCreationV2Graph["invoke"]>
>;

