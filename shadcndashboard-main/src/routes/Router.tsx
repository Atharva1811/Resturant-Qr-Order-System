import { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import Loadable from '../layouts/full/shared/loadable/Loadable';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

/* ***Restaurant Admin Views**** */
const RestaurantAdminDashboard = Loadable(lazy(() => import('../views/admin/dashboard')));
const RestaurantAdminOrders = Loadable(lazy(() => import('../views/admin/orders')));
const RestaurantAdminMenu = Loadable(lazy(() => import('../views/admin/menu')));
const RestaurantAdminTables = Loadable(lazy(() => import('../views/admin/tables')));
const RestaurantAdminStaff = Loadable(lazy(() => import('../views/admin/staff')));
const RestaurantAdminAnalytics = Loadable(lazy(() => import('../views/admin/analytics')));
const RestaurantAdminSettings = Loadable(lazy(() => import('../views/admin/settings')));

/* ***Kitchen KDS View**** */
const KitchenDashboard = Loadable(lazy(() => import('../views/kitchen/kds')));

/* ***Superadmin Views**** */
const SuperadminOverview = Loadable(lazy(() => import('../views/superadmin/overview')));
const SuperadminRestaurants = Loadable(lazy(() => import('../views/superadmin/restaurants')));
const SuperadminRestaurantDetail = Loadable(lazy(() => import('../views/superadmin/restaurants/detail')));

/* ***Customer Mobile Views**** */
const CustomerMenuPage = Loadable(lazy(() => import('../views/customer/menu')));
const CustomerOrderTrackingPage = Loadable(lazy(() => import('../views/customer/track')));

/* ***Auth & Error Views**** */
const Login = Loadable(lazy(() => import('../views/auth/login/Login')));
const UnauthorizedPage = Loadable(lazy(() => import('../views/auth/error/Unauthorized')));
const ForbiddenPage = Loadable(lazy(() => import('../views/auth/error/Forbidden')));
const SystemErrorPage = Loadable(lazy(() => import('../views/auth/error/SystemError')));
const Error = Loadable(lazy(() => import('../views/auth/error')));
const Maintenance = Loadable(lazy(() => import('../views/auth/maintenance')));

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      // Root redirects to Restaurant Admin Dashboard
      { path: '/', element: <RestaurantAdminDashboard /> },

      // Restaurant Admin routes
      { path: '/admin', element: <Navigate to="/admin/dashboard" replace /> },
      { path: '/admin/dashboard', element: <RestaurantAdminDashboard /> },
      { path: '/admin/orders', element: <RestaurantAdminOrders /> },
      { path: '/admin/menu', element: <RestaurantAdminMenu /> },
      { path: '/admin/tables', element: <RestaurantAdminTables /> },
      { path: '/admin/staff', element: <RestaurantAdminStaff /> },
      { path: '/admin/analytics', element: <RestaurantAdminAnalytics /> },
      { path: '/admin/settings', element: <RestaurantAdminSettings /> },

      // Operations / Kitchen KDS
      { path: '/kitchen', element: <Navigate to="/kitchen/orders" replace /> },
      { path: '/kitchen/orders', element: <KitchenDashboard /> },

      // Superadmin routes
      { path: '/superadmin', element: <SuperadminOverview /> },
      { path: '/superadmin/restaurants', element: <SuperadminRestaurants /> },
      { path: '/superadmin/restaurants/:id', element: <SuperadminRestaurantDetail /> },

      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      // Customer Mobile Web App routes
      { path: '/m/:slug/:table', element: <CustomerMenuPage /> },
      { path: '/m/:slug/:table/track/:orderId', element: <CustomerOrderTrackingPage /> },

      // Authentication
      { path: '/login', element: <Login /> },
      { path: '/auth/login', element: <Login /> },

      // Error / Access routes
      { path: '/unauthorized', element: <UnauthorizedPage /> },
      { path: '/forbidden', element: <ForbiddenPage /> },
      { path: '/error', element: <SystemErrorPage /> },
      { path: '/maintenance', element: <Maintenance /> },
      { path: '404', element: <Error /> },
      { path: '/auth/404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

const router = createBrowserRouter(Router, {
  basename: import.meta.env.BASE_URL,
});

export default router;
