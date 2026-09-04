import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import { config } from './config';
import { logger } from './logger';
import { apiKeyMiddleware } from './middleware/apiKeyMiddleware';
import { callRouter } from './routes/callRoutes';
import { webhookRouter } from './routes/webhookRoutes';
import { twilioRouter } from './routes/twilioRoutes';

const app = express();

app.use(express.json());
// Twilio sends form-encoded bodies for webhooks
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// Health — sin autenticación
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', provider: config.provider, port: config.port });
});

// Rutas protegidas con API key interna
app.use('/connect', apiKeyMiddleware, callRouter);
app.use('/provider/webhook', apiKeyMiddleware, webhookRouter);

// Twilio callbacks — no API key (Twilio calls these directly)
app.use('/twilio', twilioRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(config.port, () => {
  logger.info(`Running on port ${config.port} — provider: ${config.provider}`);
});

export { app };
