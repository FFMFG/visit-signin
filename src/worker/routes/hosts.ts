import { Hono } from "hono";
import type { Env } from "../env";
import { makeHostDirectory } from "../services/host-directory";

export const hosts = new Hono<{ Bindings: Env }>();

hosts.get("/", async (c) => {
  const q = c.req.query("q");
  const dir = makeHostDirectory(c.env);
  const list = q ? await dir.search(q) : await dir.list();
  return c.json({ hosts: list });
});
