export interface ProgressStep {
  id: string;
  description: string;
  completed: boolean;
}

export interface WorldCreateRequest {
  worldType: string;
  userPrompt?: string;
}

export interface WorldCreateResponse {
  success: boolean;
  steps: ProgressStep[];
  results?: any[];
  error?: string;
}
