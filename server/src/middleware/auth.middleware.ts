import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthenticatedRequest, CustomerAuthenticatedRequest, JwtUserPayload, CustomerSessionPayload, UserRole } from '../types/index.js';

export const authenticateJwt = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization header missing or invalid' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtUserPayload;
    req.user = decoded;
    if (decoded.restaurantId) {
      req.restaurantId = decoded.restaurantId;
    }
    next();
  } catch (err: any) {
    res.status(401).json({ success: false, error: 'Invalid or expired authentication token' });
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // SUPERADMIN always has access
    if (req.user.role === 'SUPERADMIN' || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: `Forbidden: role ${req.user.role} does not have required permissions`,
    });
  };
};

export const requireTenant = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  // Superadmin can pass target restaurant ID via header or query
  if (req.user.role === 'SUPERADMIN') {
    const headerTenant = req.headers['x-restaurant-id'] as string;
    const queryTenant = req.query.restaurantId as string;
    req.restaurantId = headerTenant || queryTenant || req.user.restaurantId || undefined;
    next();
    return;
  }

  // Tenant-bound staff must have a valid restaurantId
  if (!req.user.restaurantId) {
    res.status(403).json({ success: false, error: 'User is not associated with any restaurant tenant' });
    return;
  }

  req.restaurantId = req.user.restaurantId;
  next();
};

export const authenticateCustomer = (req: CustomerAuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.body.sessionToken;

  if (!token) {
    res.status(401).json({ success: false, error: 'Customer session token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as CustomerSessionPayload;
    if (decoded.type !== 'CUSTOMER_SESSION') {
      res.status(401).json({ success: false, error: 'Invalid customer token type' });
      return;
    }
    req.customerSession = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired customer session' });
  }
};
