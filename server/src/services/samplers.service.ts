import { type SamplersItemType, type SamplersSettingsType } from "@shared/types/samplers";

import { BaseService } from "@core/services/base-service";
import { ConfigService } from "@core/services/config-service";

class Samplers extends BaseService<SamplersItemType> {
  constructor() {
    super("samplers");
  }
}

class SamplersSettings extends ConfigService<SamplersSettingsType> {
  constructor() {
    super("samplers.json", { logger: console });
  }

  getDefaultConfig(): SamplersSettingsType {
    return {
      selectedId: null,
      enabled: true,
    };
  }
}

export function resolveImportedSamplerPresetName(input: string, existingNames: string[]): string {
  const base = input.trim() || "Imported sampler preset";
  if (!existingNames.includes(base)) return base;
  for (let idx = 2; idx <= 9999; idx += 1) {
    const candidate = `${base} (imported ${idx})`;
    if (!existingNames.includes(candidate)) return candidate;
  }
  return `${base} (imported ${Date.now()})`;
}

export const samplersService = {
  samplers: new Samplers(),
  samplersSettings: new SamplersSettings(),
};
