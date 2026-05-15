const DEFAULT_FALLBACK_STEP = "Бэлэн болгоод сервлэнэ.";

function trimIngredientLine(line: string): string | null {
  const t = line.replace(/^[\s>*•]+/, "").replace(/^\d+[.)]\s+/, "").trim();
  return t || null;
}

function trimStepLine(line: string): string | null {
  const t = line.trim();
  return t || null;
}

/**
 * Markdown for {@link parseAiRecipeText}: needs ingredients + steps (stub step if omitted).
 */
export function markdownFromQuickFields(input: {
  title: string;
  description?: string;
  ingredientText: string;
  stepsText?: string;
}): string {
  const title = input.title.trim() || "Шинэ жор";
  const desc = (input.description ?? "").trim();
  const descriptionBody = desc.length ? desc : title;
  const ingBullets = input.ingredientText
    .split("\n")
    .map(trimIngredientLine)
    .filter((s): s is string => s != null && s !== "")
    .map((s) => `- ${s}`)
    .join("\n");

  let stepBullets = input.stepsText
    ? input.stepsText
        .split("\n")
        .map(trimStepLine)
        .filter((s): s is string => s != null && s !== "")
        .map((s) => `- ${s.replace(/^-\s*/, "")}`)
        .join("\n")
    : "";

  if (!stepBullets) stepBullets = `- ${DEFAULT_FALLBACK_STEP}`;

  const descriptionBlock = `\n\n## Description\n\n${descriptionBody}`;

  return `# ${title}${descriptionBlock}

## Ingredients

${ingBullets}

## Steps

${stepBullets}`;
}
