import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[EXPRESS ROUTE ERROR]', err);

  const status = err.status || err.response?.status || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(status).json({
    error: true,
    status,
    message,
    // Add simple details if rate limits or unauthorized
    type: err.message === 'FINNHUB_RATE_LIMIT' ? 'API_RATE_LIMIT' : 'SERVER_ERROR'
  });
};
