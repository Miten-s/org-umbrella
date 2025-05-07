import {
    HomeIcon,
    UsersIcon,
    KeyIcon,
    ShieldCheckIcon
  } from '@heroicons/react/24/outline';

export const appRoutes = [
  {
    path: '/',
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
        title: 'Roles & Permissions',
        icon: <ShieldCheckIcon className="w-5 h-5" />,
        showInSidebar: true,
      },
      {
        path: '/access-management/admins',
        title: 'All Admins',
        icon: <UsersIcon className="w-5 h-5" />,
        showInSidebar: true,
      },
    ],
  },
];
