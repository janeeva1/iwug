import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health/db", async (_req, res) => {
  try {
    const result = await pool.query<{ now: string }>("select now() as now");
    const tables = await pool.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
    );
    res.json({
      ok: true,
      now: result.rows[0]?.now ?? null,
      tables: tables.rows.map((row) => row.table_name),
    });
  } catch (error) {
    res.status(200).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
