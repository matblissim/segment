import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Générer un token JWT
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      stravaId: user.strava_id,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Middleware pour vérifier le token JWT
export async function authenticateToken(req, res, next) {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Récupérer l'utilisateur depuis la DB
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

// Middleware optionnel (ne bloque pas si pas de token)
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
  } catch (error) {
    // On ignore les erreurs en mode optionnel
  }

  next();
}

// Middleware pour vérifier que l'utilisateur est admin
export async function requireAdmin(req, res, next) {
  try {
    if (!req.user || !req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const isAdmin = await User.isAdmin(req.userId);

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ error: 'Admin verification failed' });
  }
}

export default { generateToken, authenticateToken, optionalAuth, requireAdmin };
