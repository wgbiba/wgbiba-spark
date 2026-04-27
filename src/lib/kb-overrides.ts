/**
 * Local overrides for the knowledge base.
 *
 * The built-in KB lives in `knowledge.ts` and ships with the bundle. This
 * module layers user edits on top of it and persists them in localStorage so
 * the dashboard can add, edit, and delete Q&A entries without a backend.
 *
 * Scope (per the user's choice): Q&A only — categories and topics stay
 * read-only. Each override is keyed by `${categoryId}/${topicId}/${qaId}`.
 *
 * Storage shape (versioned for forward-compat):
 *   {
 *     version: 1,
 *     edits:   { "<full-id>": Partial<QA> },   // overrides existing fields
 *     adds:    { "<categoryId>/<topicId>": QA[] }, // user-added QAs
 *     deletes: string[]                        // full-ids of removed QAs
 *   }
 */

import { useEffect, useState } from "react";
import { KB_CATEGORIES, type Category, type QA, type Topic } from "./knowledge";

export const KB_OVERRIDES_KEY = "wgbiba.kb-overrides.v1";
const STORAGE_VERSION = 1 as const;

export type KBOverrides = {
  version: number;
  edits: Record<string, Partial<QA>>;
  adds: Record<string, QA[]>;
  deletes: string[];
};

const EMPTY: KBOverrides = {
  version: STORAGE_VERSION,
  edits: {},
  adds: {},
  deletes: [],
};

/** Custom event so multiple components stay in sync within the same tab. */
const CHANGE_EVENT = "wgbiba:kb-overrides-change";

function readRaw(): KBOverrides {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KB_OVERRIDES_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<KBOverrides>;
    return {
      version: STORAGE_VERSION,
      edits: parsed.edits && typeof parsed.edits === "object" ? parsed.edits : {},
      adds: parsed.adds && typeof parsed.adds === "object" ? parsed.adds : {},
      deletes: Array.isArray(parsed.deletes) ? parsed.deletes : [],
    };
  } catch {
    return EMPTY;
  }
}

function writeRaw(next: KBOverrides) {
  try {
    window.localStorage.setItem(KB_OVERRIDES_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    /* ignore — quota errors etc. */
  }
}

/** Read the current overrides snapshot (sync, browser-only). */
export function getOverrides(): KBOverrides {
  return readRaw();
}

/** React hook that re-renders when overrides change (in this tab or another). */
export function useKBOverrides(): KBOverrides {
  const [state, setState] = useState<KBOverrides>(EMPTY);

  useEffect(() => {
    setState(readRaw());
    const handler = () => setState(readRaw());
    window.addEventListener(CHANGE_EVENT, handler);
    window.addEventListener("storage", (e) => {
      if (e.key === KB_OVERRIDES_KEY) handler();
    });
    return () => {
      window.removeEventListener(CHANGE_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return state;
}

/** Apply overrides to the built-in categories and return a merged copy. */
export function applyOverrides(
  base: Category[],
  overrides: KBOverrides,
): Category[] {
  const deleteSet = new Set(overrides.deletes);
  return base.map((c) => ({
    ...c,
    topics: c.topics.map((t) => {
      const topicKey = `${c.id}/${t.id}`;
      const existing: QA[] = t.qa
        .filter((qa) => !deleteSet.has(`${c.id}/${t.id}/${qa.id}`))
        .map((qa) => {
          const fullId = `${c.id}/${t.id}/${qa.id}`;
          const edit = overrides.edits[fullId];
          return edit ? { ...qa, ...edit } : qa;
        });
      const added = overrides.adds[topicKey] ?? [];
      return { ...t, qa: [...existing, ...added] } satisfies Topic;
    }),
  }));
}

/** Convenience: merged categories ready to render. */
export function getMergedCategories(): Category[] {
  return applyOverrides(KB_CATEGORIES, getOverrides());
}

/** React hook returning merged categories that re-render on edits. */
export function useMergedCategories(): Category[] {
  const overrides = useKBOverrides();
  // Recompute only when overrides actually change identity.
  return applyOverrides(KB_CATEGORIES, overrides);
}

// ---------------------------------------------------------------
// Mutations — used by the dashboard editor.
// ---------------------------------------------------------------

/** Generate a slug-style id from a question title. */
export function slugifyQuestion(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || `qa-${Date.now().toString(36)}`
  );
}

/** Returns true if a QA id already exists in the merged topic. */
export function topicHasQAId(
  categoryId: string,
  topicId: string,
  qaId: string,
): boolean {
  const merged = getMergedCategories();
  const topic = merged
    .find((c) => c.id === categoryId)
    ?.topics.find((t) => t.id === topicId);
  return !!topic?.qa.some((qa) => qa.id === qaId);
}

/** Add a brand-new QA under a topic. Returns the assigned id. */
export function addQA(
  categoryId: string,
  topicId: string,
  draft: { question: string; answer: string; deepDive?: string },
): string {
  const overrides = readRaw();
  const topicKey = `${categoryId}/${topicId}`;
  let id = slugifyQuestion(draft.question);
  // Ensure uniqueness within the topic (built-in + adds).
  let suffix = 2;
  while (topicHasQAId(categoryId, topicId, id)) {
    id = `${slugifyQuestion(draft.question)}-${suffix++}`;
  }
  const newQA: QA = {
    id,
    question: draft.question.trim(),
    answer: draft.answer,
    ...(draft.deepDive ? { deepDive: draft.deepDive } : {}),
  };
  const next: KBOverrides = {
    ...overrides,
    adds: {
      ...overrides.adds,
      [topicKey]: [...(overrides.adds[topicKey] ?? []), newQA],
    },
  };
  writeRaw(next);
  return id;
}

/** Edit an existing QA. Works for both built-in and user-added entries. */
export function editQA(
  categoryId: string,
  topicId: string,
  qaId: string,
  patch: { question?: string; answer?: string; deepDive?: string },
): void {
  const overrides = readRaw();
  const topicKey = `${categoryId}/${topicId}`;
  const adds = overrides.adds[topicKey] ?? [];
  const addedIdx = adds.findIndex((qa) => qa.id === qaId);

  if (addedIdx >= 0) {
    // Edit a user-added QA in place.
    const updated: QA = {
      ...adds[addedIdx],
      ...(patch.question !== undefined ? { question: patch.question.trim() } : {}),
      ...(patch.answer !== undefined ? { answer: patch.answer } : {}),
      ...(patch.deepDive !== undefined
        ? patch.deepDive
          ? { deepDive: patch.deepDive }
          : { deepDive: undefined }
        : {}),
    };
    const nextAdds = [...adds];
    nextAdds[addedIdx] = updated;
    writeRaw({
      ...overrides,
      adds: { ...overrides.adds, [topicKey]: nextAdds },
    });
    return;
  }

  // Built-in QA — store as an edit override.
  const fullId = `${categoryId}/${topicId}/${qaId}`;
  const prev = overrides.edits[fullId] ?? {};
  const merged: Partial<QA> = { ...prev };
  if (patch.question !== undefined) merged.question = patch.question.trim();
  if (patch.answer !== undefined) merged.answer = patch.answer;
  if (patch.deepDive !== undefined) {
    if (patch.deepDive) merged.deepDive = patch.deepDive;
    else delete merged.deepDive;
  }
  writeRaw({
    ...overrides,
    edits: { ...overrides.edits, [fullId]: merged },
  });
}

/** Remove a QA — physically for user-added, soft-delete for built-in. */
export function deleteQA(categoryId: string, topicId: string, qaId: string): void {
  const overrides = readRaw();
  const topicKey = `${categoryId}/${topicId}`;
  const adds = overrides.adds[topicKey] ?? [];
  const addedIdx = adds.findIndex((qa) => qa.id === qaId);
  const fullId = `${categoryId}/${topicId}/${qaId}`;

  if (addedIdx >= 0) {
    const nextAdds = adds.filter((_, i) => i !== addedIdx);
    const nextAddsMap = { ...overrides.adds };
    if (nextAdds.length === 0) delete nextAddsMap[topicKey];
    else nextAddsMap[topicKey] = nextAdds;
    writeRaw({ ...overrides, adds: nextAddsMap });
    return;
  }

  // Soft-delete a built-in QA. Also strip any orphan edit override.
  if (overrides.deletes.includes(fullId)) return;
  const nextEdits = { ...overrides.edits };
  delete nextEdits[fullId];
  writeRaw({
    ...overrides,
    edits: nextEdits,
    deletes: [...overrides.deletes, fullId],
  });
}

/** Restore a soft-deleted built-in QA (clears the delete flag). */
export function restoreQA(categoryId: string, topicId: string, qaId: string): void {
  const overrides = readRaw();
  const fullId = `${categoryId}/${topicId}/${qaId}`;
  if (!overrides.deletes.includes(fullId)) return;
  writeRaw({
    ...overrides,
    deletes: overrides.deletes.filter((id) => id !== fullId),
  });
}

/** Discard the override for a built-in QA, returning it to its original text. */
export function resetQA(categoryId: string, topicId: string, qaId: string): void {
  const overrides = readRaw();
  const fullId = `${categoryId}/${topicId}/${qaId}`;
  if (!(fullId in overrides.edits)) return;
  const nextEdits = { ...overrides.edits };
  delete nextEdits[fullId];
  writeRaw({ ...overrides, edits: nextEdits });
}

/** Wipe everything — used by the dashboard "Reset all edits" button. */
export function clearAllOverrides(): void {
  writeRaw(EMPTY);
}

/** Quick stats for the dashboard header. */
export function getOverrideStats() {
  const o = readRaw();
  const addedCount = Object.values(o.adds).reduce((n, arr) => n + arr.length, 0);
  return {
    edited: Object.keys(o.edits).length,
    added: addedCount,
    deleted: o.deletes.length,
  };
}
