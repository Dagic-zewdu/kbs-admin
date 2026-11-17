// NEXT_PUBLIC_* values are inlined at build time (see .env.development / .env.dev / .env.prod)
export const env = {
  appEnv: process.env.NEXT_PUBLIC_APP_ENV || "local",
  apiUrl: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, ""),
};

export const API_V1_URL = `${env.apiUrl}/v1`;
