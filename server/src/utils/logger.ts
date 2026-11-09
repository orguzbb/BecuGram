import pino from 'pino';
import { env } from '../config/env.js';

const pinoLogger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  transport:
    env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export const logger = {
  info: (msg: string, ...args: any[]) => pinoLogger.info(msg, ...args),
  warn: (msg: string, ...args: any[]) => pinoLogger.warn(msg, ...args),
  error: (msgOrErr: any, ...args: any[]) => {
    if (typeof msgOrErr === 'string') {
      pinoLogger.error(msgOrErr, ...args);
    } else {
      pinoLogger.error({ err: msgOrErr }, ...args);
    }
  },
  debug: (msg: string, ...args: any[]) => pinoLogger.debug(msg, ...args),
};
