import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
  params?: ZodSchema<any>;
}

/**
 * Express middleware that validates req.body / req.query / req.params
 * against zod schemas. On failure returns 400 with a safe JSON error
 * (no raw exception messages leaked to clients).
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // Express 4 query is a getter on the prototype; reassign via defineProperty
        Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: 'validation_failed',
          issues: err.issues.map(i => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        });
        return;
      }
      res.status(400).json({ error: 'invalid_request' });
    }
  };
}

/** Safe error responder — never leaks raw exception messages. */
export function safeErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const message = err instanceof Error ? err.message : 'unknown';
  // Path-traversal style errors from resolveSafePath are client errors
  if (message.includes('Path traversal') || message.includes('outside root') || message.includes('Symlink escape')) {
    res.status(400).json({ error: 'invalid_path' });
    return;
  }
  console.error('Unhandled route error:', message);
  res.status(500).json({ error: 'internal_error' });
}
