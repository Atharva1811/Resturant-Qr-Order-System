import { Router } from 'express';
import {
  getTenants,
  createTenant,
  updateTenantStatus,
  getPlatformMetrics,
} from '../controllers/superadmin.controller.js';
import { authenticateJwt, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateJwt);
router.use(requireRole('SUPERADMIN'));

router.get('/tenants', getTenants);
router.post('/tenants', createTenant);
router.patch('/tenants/:id/status', updateTenantStatus);
router.get('/metrics', getPlatformMetrics);

export default router;
