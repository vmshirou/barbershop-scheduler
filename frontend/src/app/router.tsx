import { Navigate, createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { AdminRoute } from '../features/auth/AdminRoute';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { AdminLayout } from '../features/admin/pages/AdminLayout';
import { ClientsPage } from '../features/clients/pages/ClientPages';
import { ServicesPage } from '../features/services/pages/ServicePage';
import { UsersPage } from '../features/users/pages/UserPage';
import { CalendarPage } from '../features/calendar/pages/CalendarPage';
import { JornadaPage } from '../features/workdays/pages/WorkdayPage';
import { AppLayout } from '../components/layout/AppLayout';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'calendario', element: <CalendarPage /> },
          { path: 'jornada/:date', element: <JornadaPage /> },
          {
            element: <AdminRoute />,
            children: [
              {
                path: 'admin',
                element: <AdminLayout />,
                children: [
                  { index: true, element: <Navigate to="clientes" replace /> },
                  { path: 'clientes', element: <ClientsPage /> },
                  { path: 'servicios', element: <ServicesPage /> },
                  { path: 'usuarios', element: <UsersPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);