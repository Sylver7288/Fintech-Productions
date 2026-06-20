import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import accountsRouter from "./accounts";
import transactionsRouter from "./transactions";
import cardsRouter from "./cards";
import transfersRouter from "./transfers";
import savingsRouter from "./savings";
import airtimeRouter from "./airtime";
import billsRouter from "./bills";
import scheduledTransfersRouter from "./scheduled-transfers";
import loansRouter from "./loans";
import analyticsRouter from "./analytics";
import referralRouter from "./referral";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(accountsRouter);
router.use(transactionsRouter);
router.use(cardsRouter);
router.use(transfersRouter);
router.use(savingsRouter);
router.use(airtimeRouter);
router.use(billsRouter);
router.use(scheduledTransfersRouter);
router.use(loansRouter);
router.use(analyticsRouter);
router.use(referralRouter);

export default router;
