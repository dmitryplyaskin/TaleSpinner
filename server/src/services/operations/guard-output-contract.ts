import { z } from "zod";

import type {
  GuardOutputContract,
  GuardOutputDefinition,
} from "@shared/types/operation-profiles";

function toShape(contract: GuardOutputContract): Record<string, z.ZodBoolean> {
  return Object.fromEntries(
    contract.map((item) => [item.key, z.boolean()])
  );
}

export function compileGuardOutputSchema(contract: GuardOutputContract): z.ZodType<Record<string, boolean>> {
  return z.object(toShape(contract)).strict();
}

export function buildGuardOutputJsonSchemaSpec(contract: GuardOutputContract): Record<string, string> {
  return Object.fromEntries(contract.map((item) => [item.key, "boolean"]));
}

export function normalizeGuardOutputContract(contract: GuardOutputDefinition[]): GuardOutputContract {
  return contract.map((item) => ({
    key: item.key,
    title: item.title,
    description: item.description,
  }));
}
