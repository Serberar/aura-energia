import type { Request, Response } from 'express';
import { prisma } from '@infrastructure/prisma/prismaClient';

export class ScriptController {
  list = async (_req: Request, res: Response): Promise<void> => {
    const scripts = await (prisma as any).callScript.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
    res.json(scripts);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { name, content, order } = req.body as { name: string; content: string; order?: number };
    if (!name || !content) { res.status(400).json({ error: 'name y content son requeridos' }); return; }
    const script = await (prisma as any).callScript.create({
      data: { name, content, order: order ?? 0 },
    });
    res.status(201).json(script);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, content, order, active } = req.body as {
      name?: string; content?: string; order?: number; active?: boolean;
    };
    const script = await (prisma as any).callScript.update({
      where: { id },
      data: { ...(name !== undefined && { name }), ...(content !== undefined && { content }),
               ...(order !== undefined && { order }), ...(active !== undefined && { active }) },
    });
    res.json(script);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await (prisma as any).callScript.update({ where: { id }, data: { active: false } });
    res.status(204).end();
  };
}
