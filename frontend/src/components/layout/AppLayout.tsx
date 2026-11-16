import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";

/** Every signed-in page: the app bar with the current service's menus, then the page. */
const AppLayout: React.FC = () => (
  <div className="mx-auto min-h-screen max-w-[2400px]">
    <AppHeader />
    <div className="p-4 md:p-6">
      <Outlet />
    </div>
  </div>
);

export default AppLayout;
