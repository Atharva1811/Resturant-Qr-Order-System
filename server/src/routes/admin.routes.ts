import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleItemAvailability,
  deleteMenuItem,
  getTables,
  createTable,
  updateTable,
  regenerateTableQrToken,
  deleteTable,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getAdminOrders,
  getAnalytics,
  updateSettings,
} from '../controllers/admin.controller.js';
import { authenticateJwt, requireRole, requireTenant } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateJwt);
router.use(requireRole('RESTAURANT_ADMIN'));
router.use(requireTenant);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Menu items
router.get('/menu', getMenuItems);
router.post('/menu', createMenuItem);
router.patch('/menu/:id', updateMenuItem);
router.patch('/menu/:id/toggle-availability', toggleItemAvailability);
router.delete('/menu/:id', deleteMenuItem);

// Tables & QR codes
router.get('/tables', getTables);
router.post('/tables', createTable);
router.patch('/tables/:id', updateTable);
router.post('/tables/:id/regenerate-qr', regenerateTableQrToken);
router.delete('/tables/:id', deleteTable);

// Staff
router.get('/staff', getStaff);
router.post('/staff', createStaff);
router.patch('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);

// Orders & Analytics & Settings
router.get('/orders', getAdminOrders);
router.get('/analytics', getAnalytics);
router.patch('/settings', updateSettings);

export default router;
