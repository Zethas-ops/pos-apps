import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Receipt, 
  History as HistoryIcon, 
  MenuSquare, 
  Package, 
  Tag, 
  Users, 
  Settings as SettingsIcon,
  CreditCard,
  LogOut
} from "lucide-react";

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || (user?.role === "ADMIN" ? ["pos", "open-bills", "history", "menu", "inventory", "promo", "roles", "settings"] : []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard size={20} />, permission: null },
    { path: "/pos", label: "POS", icon: <ShoppingCart size={20} />, permission: "pos" },
    { path: "/open-bills", label: "Open Bills", icon: <Receipt size={20} />, permission: "open-bills" },
    { path: "/history", label: "History", icon: <HistoryIcon size={20} />, permission: "history" },
    { path: "/menu", label: "Menu", icon: <MenuSquare size={20} />, permission: "menu" },
    { path: "/inventory", label: "Inventory", icon: <Package size={20} />, permission: "inventory" },
    { path: "/promo", label: "Promo", icon: <Tag size={20} />, permission: "promo" },
    { path: "/roles", label: "Roles", icon: <Users size={20} />, permission: "roles" },
    { path: "/payment-methods", label: "Payment Methods", icon: <CreditCard size={20} />, permission: "settings" },
    { path: "/settings", label: "Settings", icon: <SettingsIcon size={20} />, permission: "settings" },
  ];

  // Apply theme on load
  React.useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">POS System</h1>
            {user && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome, {user.username}</p>}
          </div>
          <button
            onClick={() => {
              document.documentElement.classList.toggle('dark');
              localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
            }}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Toggle Dark Mode"
          >
            <div className="hidden dark:block">☀️</div>
            <div className="block dark:hidden">🌙</div>
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            if (item.permission && !permissions.includes(item.permission)) return null;
            
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" 
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
