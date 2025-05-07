import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import umbrellaLogo from '../../public/images/logo.png';

const Navbar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  return (
    <nav className="bg-white border-b border-gray-200 fixed z-30 h-16 w-full shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Logo & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Sidebar toggle button for mobile */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Logo */}
            <div className="flex items-center">
              <img
                src={umbrellaLogo}
                alt="Umbrella Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
              {/* <h2>Umbrella Logo*</h2> */}

          </div>

          {/* Right section: Notifications & User Info */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-900 focus:outline-none">
              <BellIcon className="w-6 h-6" />
            </button>
            <span className="text-sm font-medium text-gray-700">Admin</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
