const LABELS: Record<string, string> = {
  empty_input: "Текст хоосон байна.",
  missing_title: "Гарчиг олдсонгүй.",
  no_ingredients: "Орцны жагсаалт олдсонгүй.",
  no_steps: "Хийх алхмууд олдсонгүй.",
  json_missing_recipe: "JSON дотор recipe талбар байхгүй.",
  json_bad_ingredients: "JSON-ийн ingredients массив биш байна.",
  json_bad_steps: "JSON-ийн steps массив биш байна.",
  empty_title: "Гарчиг хоосон.",
  empty_step_description: "Хоосон алхмын тайлбар байна.",
};

export function formatParseError(code: string): string {
  return LABELS[code] ?? code;
}
