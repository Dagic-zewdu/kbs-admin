"use client";

import clsx from "clsx";
import { RefreshCw } from "lucide-react";
import { env } from "@/config/env";
import { useGetDatabaseHealthQuery, useGetServerHealthQuery } from "@/store/api/health.api";

function StatusRow({ label, isOk, isLoading, detail }: { label: string; isOk: boolean; isLoading: boolean; detail: string }) {
  const state = isLoading ? "Checking…" : isOk ? "Operational" : "Down";
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="truncate text-xs text-gray-500">{detail}</p>
      </div>
      <span
        className={clsx(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          isLoading && "bg-gray-100 text-gray-600",
          !isLoading && isOk && "bg-emerald-50 text-emerald-700",
          !isLoading && !isOk && "bg-red-50 text-red-700",
        )}
      >
        <span className={clsx("size-1.5 rounded-full", isLoading ? "bg-gray-400" : isOk ? "bg-emerald-500" : "bg-red-500")} />
        {state}
      </span>
    </div>
  );
}

const formatUptime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

/** Live status of the API server and its database (GET /health and /health/db). */
export function SystemStatus() {
  const server = useGetServerHealthQuery(undefined, { pollingInterval: 60_000 });
  const database = useGetDatabaseHealthQuery(undefined, { pollingInterval: 60_000 });

  const refresh = () => {
    server.refetch();
    database.refetch();
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">System status</h2>
          <p className="truncate text-xs text-gray-500">{env.apiUrl}</p>
        </div>
        <button onClick={refresh} className="flex size-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Refresh status">
          <RefreshCw className={clsx("size-4", (server.isFetching || database.isFetching) && "animate-spin")} />
        </button>
      </div>

      <div className="mt-2 divide-y divide-gray-100">
        <StatusRow
          label="API server"
          isLoading={server.isLoading}
          isOk={server.data?.status === "ok"}
          detail={server.data ? `Up ${formatUptime(server.data.uptimeSeconds)} · ${server.data.environment}` : "Unreachable"}
        />
        <StatusRow
          label="Database"
          isLoading={database.isLoading}
          isOk={database.data?.status === "ok"}
          detail={
            database.data
              ? `${database.data.version ?? "PostgreSQL"} · ${database.data.responseTimeMs ?? "-"} ms`
              : "Unreachable"
          }
        />
      </div>
    </section>
  );
}
