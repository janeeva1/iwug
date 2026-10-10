import { Router, type IRouter } from "express";
import authRouter from "./auth";
import dictionaryRouter from "./dictionary";
import galleryRouter from "./gallery";
import igboCommunityRouter from "./igbo-community";
import contentRouter from "./content";
import paymentsRouter from "./payments";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use(galleryRouter);
router.use(dictionaryRouter);
router.use(igboCommunityRouter);
router.use(contentRouter);
router.use(paymentsRouter);

export default router;
