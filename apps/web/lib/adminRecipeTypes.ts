export type RecipeRow = {
  title: string;
  cuisine: string;
  prep_time: number;
  cook_time: number;
  difficulty: number;
  image_r2_key?: string | null;
  gallery_r2_keys?: string | null;
  description: string;
  tips?: string | null;
  serves: number;
  is_published?: number | boolean;
  import_source?: string | null;
  import_external_id?: string | null;
};

export type IngRow = {
  id?: string;
  ingredient_canonical_id?: string | null;
  name: string;
  quantity: number;
  unit: string;
  category_id: string;
  note?: string | null;
  sort_order?: number;
};

export type StepRow = {
  id?: string;
  description: string;
  description_template?: string | null;
  timer_seconds?: number | null;
  tip?: string | null;
};

export type RecipePatchPayload = {
  recipe: RecipeRow;
  ingredients: IngRow[];
  steps: StepRow[];
  tag_ids?: string[];
};

export const INGREDIENT_CATEGORY_IDS = new Set([
  "cat-meat",
  "cat-veg",
  "cat-spice",
  "cat-dairy",
  "cat-extra",
]);
