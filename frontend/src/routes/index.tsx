import { lazy } from 'react';
import { HomeIcon, KeyIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline';
import type { AppRoute } from './types';

// Lazy-loaded pages
const Dashboard = lazy(() => import('../Pages/Dashboard'));
const RolesAndPermissions = lazy(() => import('../Pages/AccessManagement/RolesAndPermissions'));
const AllAdmins = lazy(() => import('../Pages/AccessManagement/AllAdmins'));

const routes: AppRoute[] = [
  {
    path: '/',
    element: <Dashboard />,
    title: 'Dashboard',
    icon: <HomeIcon className="w-5 h-5" />,
    showInSidebar: true,
  },
  {
    path: '/access-management',
    title: 'Access Management',
    icon: <KeyIcon className="w-5 h-5" />,
    showInSidebar: true,
    children: [
      {
        path: '/access-management/roles',
        element: <RolesAndPermissions />,
        title: 'Roles & Permissions',
        icon: <ShieldCheckIcon className="w-5 h-5" />,
        showInSidebar: true,
      },
      {
        path: '/access-management/admins',
        element: <AllAdmins />,
        title: 'All Admins',
        icon: <UsersIcon className="w-5 h-5" />,
        showInSidebar: true,
      },
    ],
  },
];

export default routes;
