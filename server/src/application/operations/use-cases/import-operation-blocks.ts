import { validateOperationBlockImport } from "../../../services/operations/operation-block-validator";
import {
  createOperationBlock,
  listOperationBlocks,
  resolveImportedOperationBlockName,
} from "../../../services/operations/operation-blocks-repository";

export async function importOperationBlocks(params: {
  ownerId: string;
  items: unknown[];
}): Promise<{
  created: Array<Awaited<ReturnType<typeof createOperationBlock>>>;
}> {
  const existing = await listOperationBlocks({ ownerId: params.ownerId });
  const names = new Set(existing.map((item) => item.name));

  const created = [];
  for (const raw of params.items) {
    const validated = validateOperationBlockImport(raw);
    const safeName = resolveImportedOperationBlockName(validated.name, Array.from(names));
    names.add(safeName);
    const block = await createOperationBlock({
      ownerId: params.ownerId,
      input: {
        ...validated,
        name: safeName,
        meta: validated.meta,
      },
    });
    created.push(block);
  }

  return { created };
}
