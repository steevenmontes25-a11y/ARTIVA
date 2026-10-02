export interface HealthResponse {
  status: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
