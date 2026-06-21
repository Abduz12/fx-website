import { handle } from "hono/netlify";
import app from "../../api/boot";

export const handler = handle(app);
