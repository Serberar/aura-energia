import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import ip from 'ip';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@infrastructure/express/swagger/swaggerConfig';

// Routes
import userRoutes from '@infrastructure/routes/userRoutes';
import allowedIpRoutes from '@infrastructure/routes/allowedIpRoutes';
import settingsRoutes from '@infrastructure/routes/settingsRoutes';

// Middleware
import logger, { morganStream } from '@infrastructure/observability/logger/logger';
import { monitoringMiddleware } from '@infrastructure/express/middleware/monitoringMiddleware';
import { errorHandler } from '@infrastructure/express/middleware/errorHandler';
import healthRoutes from '@infrastructure/routes/healthRoutes';
import {
  prometheusMiddleware,
  metricsHandler,
} from '@infrastructure/observability/metrics/prometheusMetrics';
import { serviceContainer } from '@infrastructure/container/ServiceContainer';
import { apiRateLimiter } from '@infrastructure/express/middleware/rateLimiter';
import { normalizeIp } from '@infrastructure/express/utils/normalizeIp';

/**
 * Configuración de la aplicación Express
 */
export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  /**
   * Configuración de middlewares
   */
  private configureMiddleware(): void {
    // Trust proxy
    this.app.set('trust proxy', true);

    const ALLOW_ALL_CORS = process.env.ALLOW_ALL_CORS === 'true';

    // === Helmet: Headers de seguridad HTTP ===
    this.app.use(helmet());

    // === Filtrado de IPs (controlado desde la BD, siempre registrado) ===
    this.app.use(this.ipFilterMiddleware());

    // === CORS (corregido completamente) ===
    this.app.use(this.corsMiddleware(ALLOW_ALL_CORS));

    // === Body parsing ===
    this.app.use(express.json());
    this.app.use(cookieParser());

    // === Logging HTTP ===
    this.app.use(morgan('combined', { stream: morganStream }));

    // === Métricas Prometheus ===
    this.app.use(prometheusMiddleware);

    // === Monitorización ===
    this.app.use(monitoringMiddleware);

    // === Rate limiting general para todos los endpoints de API ===
    this.app.use('/api', apiRateLimiter);
  }

  /**
   * Middleware de filtrado por IP.
   * Totalmente controlado desde la BD (con caché de 30s).
   * EMERGENCY_IP del .env siempre se permite como fallback de seguridad.
   */
  private ipFilterMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Filtrado desactivado desde la UI → pasar todo
        const filteringEnabled = await serviceContainer.systemSettingRepository.getBool('ip_filter_enabled');
        if (!filteringEnabled) return next();

        let clientIp: string | undefined;
        const forwarded = req.headers['x-forwarded-for'];

        if (typeof forwarded === 'string') {
          clientIp = forwarded.split(',')[0].trim();
        } else if (Array.isArray(forwarded)) {
          clientIp = forwarded[0].trim();
        } else {
          clientIp = req.socket.remoteAddress;
        }

        clientIp = normalizeIp(clientIp);

        // IPs privadas (red local del servidor) siempre permitidas
        if (clientIp && ip.isPrivate(clientIp)) return next();

        // IPs de la lista blanca (con caché 30s)
        const dbIps = await serviceContainer.allowedIpRepository.listIpStrings();
        if (clientIp && dbIps.includes(clientIp)) return next();

        logger.warn(`Acceso denegado desde IP: ${clientIp}`);
        res.status(403).json({ message: 'Acceso no autorizado', ip: clientIp });
      } catch (error) {
        logger.error('Error en filtrado de IP, permitiendo acceso por seguridad', { error });
        next();
      }
    };
  }

  /**
   * Middleware CORS corregido para preflight OPTIONS
   */
  private corsMiddleware(allowAll: boolean) {
    const allowedOrigins = [process.env.CORS1, process.env.CORS2, process.env.CORS3].filter(
      Boolean
    );

    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      const originAllowed = allowAll || !origin || allowedOrigins.includes(origin);

      if (req.method === 'OPTIONS') {
        if (!originAllowed) {
          logger.warn(`Preflight CORS rechazado: ${origin}`);
          return res.status(403).json({ message: 'CORS: Origen no permitido', origin });
        }
        res.header('Access-Control-Allow-Origin', origin ?? '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        return res.sendStatus(200);
      }

      if (!originAllowed) {
        logger.warn(`Origen CORS no permitido: ${origin}`);
        return res.status(403).json({ message: 'CORS: Origen no permitido', origin });
      }

      res.header('Access-Control-Allow-Origin', origin ?? '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      return next();
    };
  }

  /**
   * Configuración de rutas
   */
  private configureRoutes(): void {
    // === Favicon: silenciar petición automática del navegador ===
    this.app.get('/favicon.ico', (_req, res) => res.status(204).end());

    // === Swagger API Docs (solo en desarrollo) ===
    if (process.env.NODE_ENV !== 'production') {
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customSiteTitle: 'CRM Backend API - Docs',
      }));
      this.app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
    }

    // === API Routes ===
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/allowed-ips', allowedIpRoutes);
    this.app.use('/api/settings', settingsRoutes);

    // === Health checks ===
    this.app.use('/', healthRoutes);

    // === Métricas Prometheus (solo en desarrollo o desde red interna) ===
    if (process.env.NODE_ENV !== 'production') {
      this.app.get('/metrics', metricsHandler);
      this.app.get('/api/metrics', metricsHandler);
    }

    // === Ruta 404 ===
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Ruta no encontrada',
        path: req.path,
      });
    });
  }

  /**
   * Configuración de manejo de errores
   */
  private configureErrorHandling(): void {
    this.app.use(errorHandler); // último middleware
  }

  /**
   * Obtiene la instancia de Express
   */
  public getApp(): Application {
    return this.app;
  }
}
