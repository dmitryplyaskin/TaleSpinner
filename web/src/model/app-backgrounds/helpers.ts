import type { AppBackgroundAsset } from "@shared/types/app-background";

export function resolveActiveAppBackground(
  items: AppBackgroundAsset[],
  activeBackgroundId: string | null
): AppBackgroundAsset | null {
  if (activeBackgroundId) {
    const activeItem = items.find((item) => item.id === activeBackgroundId);
    if (activeItem) return activeItem;
  }

  return items.find((item) => item.source === "builtin") ?? items[0] ?? null;
}
