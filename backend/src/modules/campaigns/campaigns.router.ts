import { Router } from 'express';
import { z } from 'zod';
import { currentUserId, requireAuth } from '../../middleware/require-auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createCampaign } from './campaigns.service.js';

export const campaignsRouter = Router();

campaignsRouter.use(requireAuth);

const MAX_RECIPIENTS = 5_000;
const ONE_MINUTE_MS = 60 * 1000;

const createCampaignSchema = z.object({
  senderId: z.string().min(1),
  subject: z.string().trim().min(1, 'Subject is required').max(500),
  bodyHtml: z.string().min(1, 'Body is required').max(2_000_000),
  recipients: z
    .array(
      z.object({
        email: z.email(),
        name: z.string().trim().max(200).nullish(),
      }),
    )
    .min(1, 'Add at least one recipient')
    .max(MAX_RECIPIENTS, `At most ${MAX_RECIPIENTS} recipients per campaign`),
  startAt: z.coerce
    .date()
    .refine((d) => d.getTime() > Date.now() - ONE_MINUTE_MS, 'Start time is in the past'),
  delayMs: z.coerce
    .number()
    .int()
    .min(0)
    .max(24 * 60 * 60 * 1000),
  hourlyLimit: z.coerce.number().int().min(1).max(100_000),
});

type CreateCampaignBody = z.infer<typeof createCampaignSchema>;

campaignsRouter.post('/', validateBody(createCampaignSchema), async (req, res) => {
  const body = req.body as CreateCampaignBody;

  const result = await createCampaign({
    userId: currentUserId(req),
    senderId: body.senderId,
    subject: body.subject,
    bodyHtml: body.bodyHtml,
    recipients: body.recipients.map((r) => ({ email: r.email, name: r.name ?? null })),
    startAt: body.startAt,
    delayMs: body.delayMs,
    hourlyLimit: body.hourlyLimit,
  });

  res.status(201).json(result);
});
