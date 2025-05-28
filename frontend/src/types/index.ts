export interface Strategy {
  name: string;
  address: string;
  apy?: number;
}

export interface RecommendationResponse {
  strategy: string;
  reason: string;
}