export type IngredientPreviewLine = {
  name: string;
  quantity: number;
  unit: string;
  category_name: string;
  note: string | null;
  matched: boolean;
  quantity_issue?: boolean;
  quantity_status?: "enough" | "shortfall" | "unknown" | "missing";
};

export type SuggestResultRow = {
  recipe_id: string;
  title: string;
  cuisine: string;
  description: string;
  prep_time: number;
  cook_time: number;
  difficulty: number;
  serves: number;
  image_r2_key: string | null;
  match_ratio: number;
  matched_count: number;
  total_ingredients: number;
  ingredients_preview: IngredientPreviewLine[];
  pantry_shortfall?: boolean;
  missing_count?: number;
  shortfall_count?: number;
  unknown_count?: number;
  availability?: "quantities_match" | "check_quantities" | "missing_ingredients";
};

export type SuggestSortKey = "match" | "time" | "difficulty" | "serves";
