import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../../middleware/error-handler.js';
import { currentUserId, requireAuth } from '../../middleware/require-auth.js';
import { parsedQuery, validateQuery } from '../../middleware/validate.js';
import { searchEmails } from '../search/email-search.js';
import { countEmails, getEmailDetail, listEmails } from './emails.service.js';

export const emailsRouter = Router();

emailsRouter.use(requireAuth);

const listQuerySchema = z.object({
  view: z.enum(['scheduled', 'sent']).default('scheduled'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  senderId: z.string().min(1).optional(),
  status: z.enum(['scheduled', 'sending', 'sent', 'failed']).optional(),
});

const searchQuerySchema = listQuerySchema.extend({
  q: z.string().trim().min(1).max(200),
});

type ListQuery = z.infer<typeof listQuerySchema>;
type SearchQuery = z.infer<typeof searchQuerySchema>;

emailsRouter.get('/', validateQuery(listQuerySchema), async (req, res) => {
  const query = parsedQuery<ListQuery>(res);
  res.json(await listEmails({ userId: currentUserId(req), ...query }));
});

emailsRouter.get('/counts', async (req, res) => {
  res.json(await countEmails(currentUserId(req)));
});

emailsRouter.get('/search', validateQuery(searchQuerySchema), async (req, res) => {
  const query = parsedQuery<SearchQuery>(res);
  res.json(await searchEmails({ userId: currentUserId(req), ...query }));
});

emailsRouter.get('/:id', async (req, res) => {
  const detail = await getEmailDetail(currentUserId(req), String(req.params.id));
  if (!detail) throw new HttpError(404, 'Email not found');
  res.json(detail);
});
