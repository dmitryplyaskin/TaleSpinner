export type AppBackgroundSource = "builtin" | "uploaded";

export interface AppBackgroundAsset {
  id: string;
  name: string;
  source: AppBackgroundSource;
  imageUrl: string;
  deletable: boolean;
}

export interface AppBackgroundCatalog {
  items: AppBackgroundAsset[];
  activeBackgroundId: string | null;
}

export interface AppBackgroundActiveSelection {
  activeBackgroundId: string | null;
}
