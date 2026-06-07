import { Router, Request, Response } from 'express';
import { successEnvelope } from '../lib/envelope.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json(
    successEnvelope({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.0.1',
    }),
  );
});

export default router;
