import rateLimit from 'express-rate-limit';

/** Brute-force guard for the login endpoint: 10 attempts per 15 minutes per IP. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут.' },
});

/** Guard for the public partner-request form: 5 submissions per hour per IP. */
export const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Слишком много заявок. Попробуйте позже.' },
});

/** Broad safety net for the whole API. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Слишком много запросов.' },
});
