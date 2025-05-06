import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  KeyIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  submenu?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: <HomeIcon className="w-6 h-6" />
  },
 
  {
    name: 'Users',
    path: '/users',
    icon: <UsersIcon className="w-6 h-6" />
  },
  {
    name: 'Laboratory',
    path: '/lab',
    icon: <BeakerIcon className="w-6 h-6" />,
    submenu: [
      {
        name: 'Tests',
        path: '/lab/tests',
        icon: <ClipboardDocumentListIcon className="w-6 h-6" />
      }
    ]
  },

  {
    name: 'Settings',
    path: '/settings',
    icon: <Cog6ToothIcon className="w-6 h-6" />
  },
  {
    name: 'Access Management',
    path: '/access-management',
    icon: <KeyIcon className="w-6 h-6" />,
    submenu: [
      {
        name: 'Roles & Permissions',
        path: '/access-management/roles',
        icon: <ShieldCheckIcon className="w-6 h-6" />
      }
    ]
  },
];

const Sidebar = ({ isOpen }: { isOpen: boolean }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();

  const toggleSubmenu = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  const MenuItem = ({ item }: { item: MenuItem }) => {
    const isActive = location.pathname === item.path;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedItems.includes(item.name);

    return (
      <>
        <div className="relative">
          <Link
            to={item.path}
            className={`flex items-center p-2 text-base rounded-lg ${
              isActive
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-900 hover:bg-gray-100'
            }`}
            onClick={hasSubmenu ? (e) => {
              e.preventDefault();
              toggleSubmenu(item.name);
            } : undefined}
          >
            <span className="w-6 h-6 transition duration-75 text-gray-500">
              {item.icon}
            </span>
            <span className="ml-3">{item.name}</span>
            {hasSubmenu && (
              <ChevronDownIcon
                className={`w-5 h-5 ml-auto transform transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            )}
          </Link>
        </div>
        {hasSubmenu && isExpanded && (
          <div className="pl-6 mt-2">
            {item.submenu!.map((subItem) => (
              <MenuItem key={subItem.path} item={subItem} />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-20 w-64 h-screen pt-16 transition-transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } bg-white border-r border-gray-200 lg:translate-x-0`}
    >
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <MenuItem item={item} />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;