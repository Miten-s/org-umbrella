import { lazy } from 'react';
import { HomeIcon, KeyIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline';
import AppLayout from '../components/layout/AppLayout';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const RolesAndPermissions = lazy(() => import('../pages/AccessManagement/RolesAndPermissions'));
const AllAdmins = lazy(() => import('../pages/AccessManagement/AllAdmins'));

const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: '/dashboard',
        index: true, 
        element: <Dashboard />,
        title: 'Dashboard',
        icon: <HomeIcon className="w-5 h-5" />,
        showInSidebar: true,
      },
      {
        path: 'access-management',
        title: 'Access Management',
        icon: <KeyIcon className="w-5 h-5" />,
        showInSidebar: true,
        children: [
          {
            path: 'roles',
            element: <RolesAndPermissions />,
            title: 'Roles & Permissions',
            icon: <ShieldCheckIcon className="w-5 h-5" />,
            showInSidebar: true,
          },
          {
            path: 'admins',
            element: <AllAdmins />,
            title: 'All Admins',
            icon: <UsersIcon className="w-5 h-5" />,
            showInSidebar: true,
          },
        ],
      },
    ],
  },
];

export default routes;
