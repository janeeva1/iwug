import { Router, type IRouter } from "express";
import { cacheKeys, cacheTtl, withCache } from "../lib/cache";
import {
  galleryCategoryById,
  getCategoryMedia,
  getGalleryCategories,
} from "../lib/commons";

const router: IRouter = Router();

router.get("/gallery/categories", async (_req, res, next) => {
  try {
    const categories = await withCache(
      cacheKeys.galleryCategories,
      cacheTtl.long,
      getGalleryCategories,
    );
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

router.get("/gallery/media", async (req, res, next) => {
  try {
    const id = String(req.query.category ?? "").trim();
    const def = galleryCategoryById(id);
    if (!def) {
      res.status(400).json({ error: "Unknown category" });
      return;
    }
    const parsedLimit = Number(req.query.limit ?? 24);
    const limit = Math.min(48, Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 24));
    const cursor = String(req.query.cursor ?? "").trim();

    const page = await withCache(
      cacheKeys.galleryMedia(def.category, cursor, limit),
      cacheTtl.short,
      () => getCategoryMedia(def, cursor || undefined, limit),
    );

    res.json({
      categoryId: id,
      items: page.items,
      nextCursor: page.nextCursor,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
