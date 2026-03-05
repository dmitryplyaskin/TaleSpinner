import { eq, sql } from "drizzle-orm";

import { type DbExecutor, initDb } from "../../db/client";
import { chatBranches } from "../../db/schema";

type BranchTurnParams = {
  branchId: string;
  executor?: DbExecutor;
};

function readBranchCurrentTurn(db: DbExecutor, branchId: string): number {
  const rows = db
    .select({ currentTurn: chatBranches.currentTurn })
    .from(chatBranches)
    .where(eq(chatBranches.id, branchId))
    .limit(1)
    .all();
  return rows[0]?.currentTurn ?? 0;
}

export function getBranchCurrentTurn(params: BranchTurnParams & { executor: DbExecutor }): number;
export function getBranchCurrentTurn(params: BranchTurnParams): Promise<number>;
export function getBranchCurrentTurn(params: BranchTurnParams): Promise<number> | number {
  if (params.executor) {
    return readBranchCurrentTurn(params.executor, params.branchId);
  }

  return initDb().then((db) => readBranchCurrentTurn(db, params.branchId));
}

export function incrementBranchTurn(params: BranchTurnParams & { executor: DbExecutor }): number;
export function incrementBranchTurn(params: BranchTurnParams): Promise<number>;
export function incrementBranchTurn(params: BranchTurnParams): Promise<number> | number {
  const run = (db: DbExecutor): number => {
    db
      .update(chatBranches)
      .set({ currentTurn: sql`${chatBranches.currentTurn} + 1` })
      .where(eq(chatBranches.id, params.branchId))
      .run();

    return readBranchCurrentTurn(db, params.branchId);
  };

  if (params.executor) {
    return run(params.executor);
  }

  return initDb().then((db) => run(db));
}

