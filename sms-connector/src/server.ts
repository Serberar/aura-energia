import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import { config } from './config';
import { smsRouter } from './routes/smsRoutes';

const app = express();

app.use(express.json({ limit: '10mb' })); // los PDFs en base64 pueden ser grandes
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', proveedor: config.useMock ? 'mock' : 'lleida', puerto: config.port });
});

app.use('/sms', smsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(config.port, () => {
  console.log(`[sms-connector] Puerto ${config.port} | ${config.useMock ? 'MOCK' : 'Lleida'}`);
});

export { app };
