import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

/** Turns an RTK Query error into a message we can show to the user. */
export const getErrorMessage = (error: FetchBaseQueryError | SerializedError | undefined): string => {
  if (!error) return "";
  if ("status" in error) {
    if (error.status === "FETCH_ERROR") return "Cannot reach the server. Check your connection.";
    const data = error.data as { message?: string; errors?: { message: string }[] } | undefined;
    if (data?.errors?.length) return data.errors.map((e) => e.message).join(". ");
    if (data?.message) return data.message;
  }
  return "Something went wrong. Please try again.";
};
