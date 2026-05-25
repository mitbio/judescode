import { Router, type IRouter } from "express";
import healthRouter from "./health";
import trendsRouter from "./trends";
import visionRouter from "./vision";
import generateRouter from "./generate";
import outboundRouter from "./outbound";
import websiteRouter from "./website";
import pitchRouter from "./pitch";

const router: IRouter = Router();

router.use(healthRouter);
router.use(trendsRouter);
router.use(visionRouter);
router.use(generateRouter);
router.use(outboundRouter);
router.use(websiteRouter);
router.use(pitchRouter);

export default router;
