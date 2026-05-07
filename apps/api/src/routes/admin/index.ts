import { Hono } from "hono";
import type { Env } from "../../bindings";
import { adminMw } from "../../middleware/admin";
import { recipesAdmin } from "./recipesAdmin";
import { tagsAdmin } from "./tagsAdmin";
import { uploadAdmin } from "./uploadPresign";

const inner = new Hono<{ Bindings: Env }>();
inner.use("*", adminMw);

inner.route("/", recipesAdmin);
inner.route("/", tagsAdmin);
inner.route("/", uploadAdmin);

export const admin = new Hono<{ Bindings: Env }>();
admin.route("/admin", inner);
