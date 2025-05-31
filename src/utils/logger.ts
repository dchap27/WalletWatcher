export const logger = {
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(message, error);
    }
  },
  warn: (message: string) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(message);
    }
  },
  info: (message: string) => {
    if (process.env.NODE_ENV !== 'test') {
      console.info(message);
    }
  }
};