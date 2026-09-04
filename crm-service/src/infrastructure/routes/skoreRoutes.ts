import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authMiddleware } from '@infrastructure/express/middleware/authMiddleware';

const router = Router();

const SKORE_BASE_URL = process.env.SKORE_BASE_URL ?? 'https://ws.1skore.com';

/**
 * POST /api/skore/login
 * Autentica contra 1Skore usando credenciales del servidor (no expuestas al browser).
 * Devuelve el PHPSESSID al frontend para que lo use en búsquedas.
 */
router.post('/login', authMiddleware, async (_req: Request, res: Response) => {
  const user = process.env.SKORE_USER;
  const pwd  = process.env.SKORE_PASSWORD;

  if (!user || !pwd) {
    res.status(503).json({ error: '1Skore no configurado' });
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append('method', 'login');
    params.append('name', user);
    params.append('pwd', pwd);
    params.append('rol', '');

    const response = await axios.post(
      `${SKORE_BASE_URL}/process_login.php`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
        },
      }
    );

    const cookieHeader = response.headers['set-cookie'];
    let sessionId = '';
    if (cookieHeader && cookieHeader[0]) {
      sessionId = cookieHeader[0].split(';')[0].replace('PHPSESSID=', '');
    }

    res.json({ sessionId, data: response.data });
  } catch (err: unknown) {
    const e = err as { response?: { status?: number; data?: unknown } };
    res.status(e.response?.status ?? 502).json(e.response?.data ?? { error: '1Skore no disponible' });
  }
});

/**
 * POST /api/skore/search
 * Proxea una búsqueda a 1Skore usando el sessionId aportado por el frontend.
 */
router.post('/search', authMiddleware, async (req: Request, res: Response) => {
  const { sessionId, params: searchParams } = req.body as {
    sessionId?: string;
    params?: Record<string, string | string[]>;
  };

  if (!sessionId) {
    res.status(422).json({ error: 'sessionId requerido' });
    return;
  }

  try {
    const formParams = new URLSearchParams();
    if (searchParams) {
      for (const [key, val] of Object.entries(searchParams)) {
        if (Array.isArray(val)) {
          val.forEach((v) => formParams.append(key, v));
        } else {
          formParams.append(key, val);
        }
      }
    }

    const response = await axios.post(
      `${SKORE_BASE_URL}/process_user.php`,
      formParams.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
          Cookie: `PHPSESSID=${sessionId}`,
        },
      }
    );

    res.json(response.data);
  } catch (err: unknown) {
    const e = err as { response?: { status?: number; data?: unknown } };
    res.status(e.response?.status ?? 502).json(e.response?.data ?? { error: '1Skore no disponible' });
  }
});

export default router;
