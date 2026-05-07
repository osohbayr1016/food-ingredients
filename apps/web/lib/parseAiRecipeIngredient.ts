import type { IngRow } from "./adminRecipeTypes";
import {
  QTY_PATTERN,
  UNIT_PATTERN,
  coalesceIngredientLines,
  isStandaloneUnitNoiseLine,
  isUnitLikeIngredientName,
  normalizeIngredientUnit,
  parseQtyToken,
  stripLeadingUnitColumnLine,
} from "./parseAiRecipeIngredientUnits";

const MEAT =
  /тахиа|мах|ямаа|үхэр|тахианы|beef|pork|chicken|lamb|fish|salmon|shrimp|bacon|sausage|steak|pepperoni|төрөл бүрийн мах/i;
const VEG =
  /сонгино|лууван|ногоо|томь|үлэр|омлет|bok|байцай|өндөгний|хүнсний ногоо|onion|carrot|celery|broccoli|spinach|pepper|tomato|cabbage|lettuce|garlic|ginger|potato|mushroom|scallion|herb/i;
const SPICE =
  /давс|амтлагч|соус|чихэр|экстракт|спирт|ус|самжанг|чили|папrika|curry|спайс|spice|sauce|soy|vinegar|oil\b|pepper|salt|seasoning|маринад/i;
const DAIRY =
  /сүү|уурц|бяслаг|Өрөм|өндөг|cream|milk|cheese|yogurt|butter|margarine|mayo|майонез/i;

export function guessIngredientCategory(name: string): string {
  const s = name.trim();
  if (!s) return "cat-extra";
  if (MEAT.test(s)) return "cat-meat";
  if (DAIRY.test(s)) return "cat-dairy";
  if (SPICE.test(s)) return "cat-spice";
  if (VEG.test(s)) return "cat-veg";
  return "cat-extra";
}

export { coalesceIngredientLines };

function stripBullet(line: string): string {
  return line.replace(/^[\s>*•·]+/, "").replace(/^\d+[.)]\s+/, "").trim();
}

/** Parse one ingredient line into a row, or null if empty/noise. */
export function parseIngredientLine(line: string, sortOrder: number): IngRow | null {
  const raw = stripLeadingUnitColumnLine(stripBullet(line));
  if (!raw || /^#{1,6}\s/.test(raw)) return null;
  if (/^[-_=]{3,}$/.test(raw)) return null;
  if (isStandaloneUnitNoiseLine(raw)) return null;
  if (
    /^(?:servings|serving|serves?|ingredients|steps|notes|tips|орц(?:ны\s*жагсаалт)?|алхам|заавар|тайлбар|зөвлөгөө)$/i.test(
      raw,
    )
  )
    return null;
  if (/^\d+$/.test(raw)) return null;

  const qtyUnitName = new RegExp(
    `^(${QTY_PATTERN})\\s*(${UNIT_PATTERN})\\s+(.+)$`,
    "i",
  );
  const m1 = raw.match(qtyUnitName);
  if (m1) {
    const name = m1[3].trim();
    if (!name || isUnitLikeIngredientName(name)) return null;
    return {
      name,
      quantity: parseQtyToken(m1[1]),
      unit: normalizeIngredientUnit(m1[2]),
      category_id: guessIngredientCategory(name),
      sort_order: sortOrder,
    };
  }

  const nameQtyUnit = new RegExp(
    `^(.+?)\\s*[–—:\\-]\\s*(${QTY_PATTERN})\\s*(${UNIT_PATTERN})?\\s*$`,
    "i",
  );
  const m2 = raw.match(nameQtyUnit);
  if (m2) {
    const name = m2[1].trim();
    const unit = normalizeIngredientUnit((m2[3] || "").trim() || "");
    if (!name || isStandaloneUnitNoiseLine(name) || isUnitLikeIngredientName(name))
      return null;
    return {
      name,
      quantity: parseQtyToken(m2[2]),
      unit,
      category_id: guessIngredientCategory(name),
      sort_order: sortOrder,
    };
  }

  const western = new RegExp(
    `^(${QTY_PATTERN})\\s*(${UNIT_PATTERN})\\s+of\\s+(.+)$`,
    "i",
  );
  const m3 = raw.match(western);
  if (m3) {
    const name = m3[3].trim();
    if (!name || isUnitLikeIngredientName(name)) return null;
    return {
      name,
      quantity: parseQtyToken(m3[1]),
      unit: normalizeIngredientUnit(m3[2]),
      category_id: guessIngredientCategory(name),
      sort_order: sortOrder,
    };
  }

  const nameLast = new RegExp(
    `^(.+?)\\s+(${QTY_PATTERN})\\s*(${UNIT_PATTERN})?$`,
    "i",
  );
  const m4 = raw.match(nameLast);
  if (m4) {
    const name = m4[1].trim();
    if (name && !isStandaloneUnitNoiseLine(name) && !isUnitLikeIngredientName(name)) {
      const unit = normalizeIngredientUnit((m4[3] || "").trim());
      if (/[\d½¼⅓⅔⅛¾]/.test(m4[2]))
        return {
          name,
          quantity: parseQtyToken(m4[2]),
          unit,
          category_id: guessIngredientCategory(name),
          sort_order: sortOrder,
        };
    }
  }

  const qtyOnlyNameAfter = new RegExp(
    `^(${QTY_PATTERN})\\s*(${UNIT_PATTERN})\\s*$`,
    "i",
  );
  if (qtyOnlyNameAfter.test(raw)) return null;
  if (isUnitLikeIngredientName(raw)) return null;

  return {
    name: raw,
    quantity: 1,
    unit: "",
    category_id: guessIngredientCategory(raw),
    sort_order: sortOrder,
  };
}
