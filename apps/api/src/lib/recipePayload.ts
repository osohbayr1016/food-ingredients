export type RecipeRow = {
  title: string;
  cuisine: string;
  prep_time: number;
  cook_time: number;
  difficulty: number;
  image_r2_key?: string | null;
  /** JSON array string, e.g. `["recipes/id/k1.png","recipes/id/k2.jpg"]` */
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

export type RecipeMetadata = {
  source_url?: string | null;
  license_name?: string | null;
  video_url?: string | null;
  review_status?: "pending" | "approved";
  allergen_status?: "unknown" | "ingredients_reviewed";
  allergens?: string[];
  nutrition_source?: string | null;
  calories_kcal?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
};

export type RecipePatchPayload = {
  metadata?: RecipeMetadata;
  recipe: RecipeRow;
  ingredients: IngRow[];
  steps: StepRow[];
  tag_ids?: string[];
};
