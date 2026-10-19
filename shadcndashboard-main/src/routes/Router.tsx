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

/* ***Auth & Shared Views**** */
const DemoLogin = Loadable(lazy(() => import('../views/auth/login/DemoLogin')));
const UnauthorizedPage = Loadable(lazy(() => import('../views/auth/error/Unauthorized')));
const ForbiddenPage = Loadable(lazy(() => import('../views/auth/error/Forbidden')));
const SystemErrorPage = Loadable(lazy(() => import('../views/auth/error/SystemError')));
const Error = Loadable(lazy(() => import('../views/auth/error')));

/* ***Template Pages (Preserved)**** */
const ModernDashboard = Loadable(lazy(() => import('../views/dashboards/modern')));
const Blog = Loadable(lazy(() => import('../views/apps/blog/post')));
const BlogDetail = Loadable(lazy(() => import('../views/apps/blog/detail')));
const BlogAdd = Loadable(lazy(() => import('../views/apps/blog/create')));
const BlogEdit = Loadable(lazy(() => import('../views/apps/blog/edit')));
const BlogTable = Loadable(lazy(() => import('../views/apps/blog/manage-blog')));
const Notes = Loadable(lazy(() => import('../views/apps/notes')));
const Tickets = Loadable(lazy(() => import('../views/apps/tickets')));
const TicketCreate = Loadable(lazy(() => import('../views/apps/tickets/create')));
const TablesPage = Loadable(lazy(() => import('../views/pages/tables')));
const FormPage = Loadable(lazy(() => import('../views/pages/form')));
const UserProfilePage = Loadable(lazy(() => import('../views/pages/user-profile')));
const SolarIcon = Loadable(lazy(() => import('../views/icons/iconify')));
const Login2 = Loadable(lazy(() => import('../views/auth/auth2/login')));
const Register2 = Loadable(lazy(() => import('../views/auth/auth2/register')));
const ForgotPassword2 = Loadable(lazy(() => import('../views/auth/auth2/forgot-password')));
const TwoSteps2 = Loadable(lazy(() => import('../views/auth/auth2/two-steps')));
const Maintainance = Loadable(lazy(() => import('../views/auth/maintenance')));

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

      // Preserved template views
      { path: '/dashboards/modern', element: <ModernDashboard /> },
      { path: '/apps/blog/post', element: <Blog /> },
      { path: '/apps/blog/detail/:id', element: <BlogDetail /> },
      { path: '/apps/blog/create', element: <BlogAdd /> },
      { path: '/apps/blog/edit', element: <BlogEdit /> },
      { path: '/apps/blog/manage-blog', element: <BlogTable /> },
      { path: '/apps/notes', element: <Notes /> },
      { path: '/apps/tickets', element: <Tickets /> },
      { path: '/apps/tickets/create', element: <TicketCreate /> },
      { path: '/pages/tables', element: <TablesPage /> },
      { path: '/pages/form', element: <FormPage /> },
      { path: '/pages/user-profile', element: <UserProfilePage /> },
      { path: '/icons/iconify', element: <SolarIcon /> },

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

      // Authentication & Demo Login
      { path: '/login', element: <DemoLogin /> },

      // Error / Access routes
      { path: '/unauthorized', element: <UnauthorizedPage /> },
      { path: '/forbidden', element: <ForbiddenPage /> },
      { path: '/error', element: <SystemErrorPage /> },

      // Preserved template auth views
      { path: '/auth/auth2/login', element: <Login2 /> },
      { path: '/auth/auth2/register', element: <Register2 /> },
      { path: '/auth/auth2/forgot-password', element: <ForgotPassword2 /> },
      { path: '/auth/auth2/two-steps', element: <TwoSteps2 /> },
      { path: '/auth/maintenance', element: <Maintainance /> },
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
