import type { ClarificationRequest } from '@shared/types/human-in-the-loop';

/**
 * Определяет, является ли запрос на утверждение Скелета мира
 */
export function isSkeletonApprovalRequest(request: ClarificationRequest | null): boolean {
  if (!request) return false;
  
  // Скелет имеет поля: modules (multiselect), feedback (textarea), action (radio)
  const hasModulesField = request.fields.some(
    (f) => f.id === 'modules' && f.type === 'multiselect'
  );
  
  const hasActionField = request.fields.some(
    (f) => f.id === 'action' && f.type === 'radio'
  );
  
  return hasModulesField && hasActionField && request.context.currentNode === 'architect';
}

/**
 * Определяет, являются ли это вопросы с вариантами ответов от Архитектора
 */
export function isArchitectQuestions(request: ClarificationRequest | null): boolean {
  if (!request) return false;
  
  // Вопросы от Архитектора имеют nodeRef === 'architect' и НЕ имеют поля modules
  return (
    request.context.currentNode === 'architect' &&
    !isSkeletonApprovalRequest(request)
  );
}

/**
 * Определяет, это вопросы от генерирующих узлов (base, factions, etc.)
 */
export function isGenerationNodeQuestions(request: ClarificationRequest | null): boolean {
  if (!request) return false;
  
  const generationNodes = ['generateBase', 'generateFactions', 'reviewWorld'];
  return generationNodes.includes(request.context.currentNode);
}
