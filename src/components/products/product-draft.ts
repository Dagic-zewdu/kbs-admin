/**
 * Keeps what is typed in the product form on this device, so a refresh or
 * going to another page loses nothing. One record per signed-in user and product ("new" for a new one).
 */

const PREFIX = "kbs.productDraft";
/** Older kept copies are dropped */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type DraftRecord<Form> = {
  /** The step that was open */
  step: string;
  /** Steps opened before */
  visited?: string[];
  /** Only when something was changed and not saved */
  form?: Form;
  /** When the form was kept */
  savedAt: number;
  /** The product's updatedAt the changes were made on: a newer save on the server wins */
  baseUpdatedAt?: string;
};

export const draftKey = (userId: string | undefined, productId: string | undefined) => `${PREFIX}:${userId ?? "guest"}:${productId ?? "new"}`;

export function readDraft<Form>(key: string): DraftRecord<Form> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const record = JSON.parse(raw) as DraftRecord<Form>;
    if (typeof record?.step !== "string" || Date.now() - record.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

export function writeDraft<Form>(key: string, record: DraftRecord<Form>) {
  try {
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch {
    // Storage full or blocked: the form still works, it just isn't kept
  }
}

export function removeDraft(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do
  }
}

/** "just now", "5 min ago", "3 h ago", or the date */
export function timeAgo(at: number) {
  const minutes = Math.round((Date.now() - at) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(at).toLocaleDateString();
}
