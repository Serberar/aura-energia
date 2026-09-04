import { Router, Request, Response } from 'express';
import { prisma } from '@infrastructure/prisma/prismaClient';
import { internalApiKeyMiddleware } from '@infrastructure/express/middleware/internalApiKeyMiddleware';

const router = Router();

router.use(internalApiKeyMiddleware);

/**
 * GET /internal/clients-for-campaign
 *
 * Query params:
 *   saleStatusIds — comma-separated SaleStatus IDs to filter by
 *   productIds    — comma-separated Product IDs to filter by
 *   maxResults    — max clients to return (default 1000, max 5000)
 *
 * Returns clients with at least one phone number that match the criteria.
 */
router.get('/clients-for-campaign', async (req: Request, res: Response): Promise<void> => {
  try {
    const { saleStatusIds, productIds, maxResults } = req.query as {
      saleStatusIds?: string;
      productIds?: string;
      maxResults?: string;
    };

    const statusIds = saleStatusIds ? saleStatusIds.split(',').filter(Boolean) : [];
    const prodIds   = productIds    ? productIds.split(',').filter(Boolean)    : [];
    const limit     = Math.min(parseInt(maxResults ?? '1000', 10), 5000);

    const clients = await prisma.client.findMany({
      where: {
        ...(statusIds.length > 0 && {
          sales: { some: { statusId: { in: statusIds } } },
        }),
        ...(prodIds.length > 0 && {
          sales: { some: { items: { some: { productId: { in: prodIds } } } } },
        }),
      },
      select: {
        id:           true,
        firstName:    true,
        lastName:     true,
        businessName: true,
        phones:       true,
      },
      take:    limit,
      orderBy: { createdAt: 'desc' },
    });

    const withPhones = clients.filter((c) => c.phones.length > 0);
    res.json(withPhones);
  } catch (err) {
    console.error('[internalRoutes] /clients-for-campaign error:', err);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

export default router;
