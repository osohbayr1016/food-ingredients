import { Hono } from "hono";
import type { Env } from "../../bindings";
import { adminMw } from "../../middleware/admin";
import { recipesAdmin } from "./recipesAdmin";
import { tagsAdmin } from "./tagsAdmin";
import { uploadAdmin } from "./uploadPresign";
import { uploadBind } from "./uploadBind";

import { themealdbImportAdmin } from "./themealdbImportAdmin";

const inner = new Hono<{ Bindings: Env }>();
inner.use("*", adminMw);

inner.route("/", recipesAdmin);
inner.route("/", tagsAdmin);
inner.route("/", uploadAdmin);
inner.route("/", uploadBind);
inner.route("/", themealdbImportAdmin);

export const admin = new Hono<{ Bindings: Env }>();
admin.route("/admin", inner);
