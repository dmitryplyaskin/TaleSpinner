export type OperationRuntimeStateItem = {
  opId: string;
  everyNTurns?: number;
  everyNContextTokens?: number;
  turnsCounter: number;
  tokensCounter: number;
  isReachedNow: boolean;
};

export type ChatOperationRuntimeStateDto = {
  chatId: string;
  branchId: string;
  profileId: string | null;
  operationProfileSessionId: string | null;
  updatedAt: string | null;
  operations: OperationRuntimeStateItem[];
};
