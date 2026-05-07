import type { RecipePatchPayload } from "./adminRecipeTypes";
import { normalizeRecipePatchPayload } from "./parseAiRecipeJson";
import { parseMarkdownRecipe } from "./parseAiRecipeMarkdown";

function stripOuterFence(raw: string): string {
  const t = raw.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im;
  const m = t.match(fence);
  if (m) return m[1].trim();
  return t;
}

function tryParseJsonObject(raw: string): Record<string, unknown> | null {
  const t = stripOuterFence(raw);
  if (!t.startsWith("{")) return null;
  try {
    const v = JSON.parse(t) as unknown;
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function parseAiRecipeText(
  raw: string,
):
  | { ok: true; payload: RecipePatchPayload }
  | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: false, error: "empty_input" };

  const jsonObj = tryParseJsonObject(t);
  if (jsonObj) {
    const n = normalizeRecipePatchPayload(jsonObj);
    if (n.ok) return n;
  }

  return parseMarkdownRecipe(t);
}
