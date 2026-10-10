import { Router, type IRouter } from "express";
import { cacheKeys, cacheTtl, withCache } from "../lib/cache";
import { searchDictionary } from "../lib/dictionary";

const router: IRouter = Router();

router.get("/dictionary/search", async (req, res, next) => {
  try {
    const query = String(req.query.q ?? req.query.query ?? "").trim();
    if (!query) {
      res.json({ query: "", provider: "none", entries: [] });
      return;
    }
    const result = await withCache(
      cacheKeys.dictionarySearch(query),
      cacheTtl.medium,
      () => searchDictionary(query),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
