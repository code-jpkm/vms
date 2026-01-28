import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export function signSession(payload, { expiresIn = '7d' } = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifySession(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getBearerToken(req) {
  const auth = req.headers.get('authorization') || '';
  const [scheme, token] = auth.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export function requireSession(req) {
  const token = getBearerToken(req);
  if (!token) return { ok: false, status: 401, message: 'Missing Authorization header' };
  const session = verifySession(token);
  if (!session) return { ok: false, status: 401, message: 'Invalid or expired token' };
  return { ok: true, session };
}

export function requireRole(session, roles) {
  if (!session?.role) return false;
  return roles.includes(session.role);
}
