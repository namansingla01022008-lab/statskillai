import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'statskillai_dev_secret_key_change_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'statskillai_refresh_secret_change_in_production';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: 'learner' | 'mentor' | 'admin';
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

// --- Password Validation ---
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit.');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...).');
  }

  return { valid: errors.length === 0, errors };
}

// --- Email Validation ---
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// --- Token Management ---
export function signToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
  } catch (err) {
    return null;
  }
}

// --- Authentication Middleware ---
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  // 1. Bearer token in Authorization header (primary)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. HTTP-only cookie fallback
  if (!token && (req as any).cookies && (req as any).cookies.statskill_token) {
    token = (req as any).cookies.statskill_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  req.user = payload;
  next();
}

// --- Role-Based Access Control ---
export function requireRole(allowedRoles: Array<'learner' | 'mentor' | 'admin'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: role '${req.user.role}' is not authorized for this resource. Required: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

// --- Row-Level Tenant Security Helper ---
// Verifies that the currently authenticated user owns the resource identified by resourceUserId.
// Admins bypass ownership checks by default (configurable).
export function requireOwnership(
  resourceUserId: string,
  authenticatedUser: AuthUserPayload,
  options: { allowAdmin?: boolean } = { allowAdmin: true },
): boolean {
  if (options.allowAdmin && authenticatedUser.role === 'admin') {
    return true;
  }
  return authenticatedUser.userId === resourceUserId;
}
