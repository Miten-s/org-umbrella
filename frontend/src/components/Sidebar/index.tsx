import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { AppRoute } from '../../routes/types';
import routes from '../../routes';


const Sidebar = ({ isOpen }: { isOpen: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleExpand = (title: string) => {
    setExpanded(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const renderMenuItems = (items: AppRoute[]) => {
    return items
      .filter(item => item.showInSidebar)
      .map(item => {
        const isActive = location.pathname === item.path;
        const hasChildren = item.children?.some(child => child.showInSidebar);
        const isExpanded = expanded.includes(item.title ?? '');

        return (
          <div key={item.path}>
            <button
              onClick={() => {
                if (hasChildren) toggleExpand(item.title ?? '');
                if (item.path && !hasChildren) navigate(item.path);
              }}
              className={`flex items-center w-full px-4 py-2 text-left ${
                isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <span className="w-5 h-5 text-gray-500">{item.icon}</span>
              <span className="ml-3 flex-1">{item.title}</span>
              {hasChildren && (
                <ChevronDownIcon
                  className={`w-4 h-4 ml-auto transform transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>
            {hasChildren && isExpanded && (
              <div className="ml-6">{renderMenuItems(item.children!)}</div>
            )}
          </div>
        );
      });
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-20 h-[calc(100vh-64px)]  w-64 pt-16 transition-transform bg-white border-r border-gray-200 ${
        isOpen ? 'block' : 'hidden'
      }`}
    >
      <div className="h-full px-3 py-4 overflow-y-auto">
        {renderMenuItems(routes)}
      </div>
    </aside>
  );
};

export default Sidebar;
