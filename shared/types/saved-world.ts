import { WorldData } from "./world-data";

export interface SavedWorld {
  id: string;
  name: string;
  genre: string;
  tone: string;
  description: string;
  is_favorite: boolean;
  data: WorldData;
  created_at: string;
  updated_at: string;
}

