import type { UserRole } from "@/types/auth";

export const roleLabels: Record<UserRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  user: "User",
};

export const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

/** "2028-08-31" as a date, without time zone shifts */
export const formatDay = (value: string | null) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

export const formatPrice = (value: number | null) =>
  value === null ? "—" : `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB`;

/** The shop's time zone: Ethiopia, GMT+3 */
export const SHOP_TIME_ZONE = "Africa/Addis_Ababa";

/** "28 Nov 2026, 20:15" in Ethiopian time (GMT+3), whatever the device's time zone */
export const formatDateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: SHOP_TIME_ZONE })
    : "—";

/** Now in Ethiopian time, as a date-time field value: "2026-11-28T20:15" */
export const nowLocalInput = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour === "24" ? "00" : parts.hour}:${parts.minute}`;
};

/** A date-time field value typed in Ethiopian time, sent with its +03:00 */
export const localInputToIso = (value: string) => (value ? `${value}:00+03:00` : null);
