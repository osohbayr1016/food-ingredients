export type RecipeListItem = {
  id: string;
  title: string;
  cuisine: string;
  prep_time: number;
  cook_time: number;
  difficulty: number;
  image_r2_key: string | null;
  description: string;
  tips: string | null;
  serves: number;
  is_published: number;
  created_at: string;
};

export type IngredientRow = {
  id: string;
  recipe_id: string;
  ingredient_canonical_id: string | null;
  name: string;
  quantity: number;
  unit: string;
  category_id: string;
  category_name: string;
  note: string | null;
  sort_order: number;
};

export type StepRow = {
  id: string;
  recipe_id: string;
  step_order: number;
  description: string;
  description_template: string | null;
  timer_seconds: number | null;
  tip: string | null;
};

export type TagRow = { id: string; name: string };

export type RecipeDetail = {
  recipe: RecipeListItem;
  ingredients: IngredientRow[];
  steps: StepRow[];
  tags: TagRow[];
};
