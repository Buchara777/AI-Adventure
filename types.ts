
export interface GameTurn {
  id: number;
  action: string;
  story: string;
}

export interface GeminiResponse {
  story: string;
  choices: string[];
}
