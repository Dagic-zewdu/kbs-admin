import { env } from "@/config/env";
import { baseApi } from "./base-api";

export interface ServerHealth {
  status: "ok" | "error";
  environment: string;
  version: string;
  uptimeSeconds: number;
}

export interface DatabaseHealth {
  status: "ok" | "error";
  database: string;
  version?: string;
  responseTimeMs?: number;
  message?: string;
}

// The health endpoints live at the API root (not under /v1), so we pass absolute URLs
export const healthApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getServerHealth: build.query<ServerHealth, void>({
      query: () => `${env.apiUrl}/health`,
    }),
    getDatabaseHealth: build.query<DatabaseHealth, void>({
      query: () => `${env.apiUrl}/health/db`,
      // a 503 still carries a useful body
      transformErrorResponse: (response) => response,
    }),
  }),
});

export const { useGetServerHealthQuery, useGetDatabaseHealthQuery } = healthApi;
