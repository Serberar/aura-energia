const isProduction = process.env.NODE_ENV === 'production';

function format(level: string, message: string, meta?: unknown): string {
  if (isProduction) {
    return JSON.stringify({ level, message, ...(meta !== undefined && { meta }), ts: new Date().toISOString() });
  }
  return `[calls-connector] ${level.toUpperCase()} ${message}${meta !== undefined ? ' ' + JSON.stringify(meta) : ''}`;
}

export const logger = {
  info:  (msg: string, meta?: unknown) => console.log(format('info',  msg, meta)),
  warn:  (msg: string, meta?: unknown) => console.warn(format('warn',  msg, meta)),
  error: (msg: string, meta?: unknown) => console.error(format('error', msg, meta)),
};
