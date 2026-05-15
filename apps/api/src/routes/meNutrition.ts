import { Hono } from "hono";
import type { Env } from "../bindings";
import { bearerPayload } from "../lib/authBearer";
import { d1ErrorMessage, isD1NoSuchTableUsers } from "../lib/d1Errors";
import {
  type NutritionProfileRow,
  rowToInput,
} from "../lib/meNutritionShared";
import {
  type BodyStatsInput,
  computeTargets,
  validateBodyStats,
} from "../lib/nutritionTargets";

export const meNutrition = new Hono<{ Bindings: Env }>();

meNutrition.get("/me/nutrition", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ error: "unauthorized" }, 401);
  try {
    const row = await c.env.DB.prepare(
      `SELECT user_id, sex, age_years, height_cm, weight_kg, activity_level, goal, updated_at
       FROM user_nutrition_profiles WHERE user_id = ?`,
    )
      .bind(jwt.sub)
      .first<NutritionProfileRow>();
    if (!row) return c.json({ profile: null, targets: null });
    const input = rowToInput(row);
    const targets = computeTargets(input);
    return c.json({
      profile: {
        sex: row.sex,
        age_years: row.age_years,
        height_cm: row.height_cm,
        weight_kg: row.weight_kg,
        activity_level: row.activity_level,
        goal: row.goal,
        updated_at: row.updated_at,
      },
      targets,
    });
  } catch (e) {
    const msg = d1ErrorMessage(e);
    if (/no such table/i.test(msg) && /user_nutrition_profiles/i.test(msg)) {
      return c.json(
        {
          error: "nutrition_unavailable",
          hint: "Apply D1 migration db/0005_user_nutrition.sql.",
        },
        503,
      );
    }
    if (isD1NoSuchTableUsers(e)) {
      return c.json(
        {
          error: "auth_unavailable",
          hint: "Apply D1 migration db/0003_auth_users.sql.",
        },
        503,
      );
    }
    console.error("me/nutrition GET", e);
    return c.json({ error: "nutrition_read_failed" }, 500);
  }
});

meNutrition.put("/me/nutrition", async (c) => {
  const jwt = await bearerPayload(c);
  if (!jwt) return c.json({ error: "unauthorized" }, 401);
  const body = (await c.req.json().catch(() => null)) as Partial<BodyStatsInput> | null;
  if (!body) return c.json({ error: "invalid_json" }, 400);

  const sex = body.sex;
  if (sex !== "male" && sex !== "female") return c.json({ error: "invalid_sex" }, 400);

  const input: BodyStatsInput = {
    sex,
    age_years: Number(body.age_years),
    height_cm: Number(body.height_cm),
    weight_kg: Number(body.weight_kg),
    activity_level: body.activity_level as BodyStatsInput["activity_level"],
    goal: body.goal as BodyStatsInput["goal"],
  };

  const err = validateBodyStats(input);
  if (err) return c.json({ error: err }, 400);

  try {
    await c.env.DB.prepare(
      `INSERT INTO user_nutrition_profiles
        (user_id, sex, age_years, height_cm, weight_kg, activity_level, goal, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         sex = excluded.sex,
         age_years = excluded.age_years,
         height_cm = excluded.height_cm,
         weight_kg = excluded.weight_kg,
         activity_level = excluded.activity_level,
         goal = excluded.goal,
         updated_at = excluded.updated_at`,
    )
      .bind(
        jwt.sub,
        input.sex,
        Math.trunc(input.age_years),
        input.height_cm,
        input.weight_kg,
        input.activity_level,
        input.goal,
      )
      .run();

    const row = await c.env.DB.prepare(
      `SELECT user_id, sex, age_years, height_cm, weight_kg, activity_level, goal, updated_at
       FROM user_nutrition_profiles WHERE user_id = ?`,
    )
      .bind(jwt.sub)
      .first<NutritionProfileRow>();

    if (!row) return c.json({ error: "nutrition_save_failed" }, 500);
    const targets = computeTargets(rowToInput(row));
    return c.json({
      profile: {
        sex: row.sex,
        age_years: row.age_years,
        height_cm: row.height_cm,
        weight_kg: row.weight_kg,
        activity_level: row.activity_level,
        goal: row.goal,
        updated_at: row.updated_at,
      },
      targets,
    });
  } catch (e) {
    const msg = d1ErrorMessage(e);
    if (/no such table/i.test(msg) && /user_nutrition_profiles/i.test(msg)) {
      return c.json(
        {
          error: "nutrition_unavailable",
          hint: "Apply D1 migration db/0005_user_nutrition.sql.",
        },
        503,
      );
    }
    console.error("me/nutrition PUT", e);
    return c.json({ error: "nutrition_write_failed" }, 500);
  }
});
