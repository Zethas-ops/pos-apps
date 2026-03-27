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
    { path: "/settings", label: "Settings", icon: <SettingsIcon size={20} />, permission: "settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">POS System</h1>
          {user && <p className="text-sm text-gray-500 mt-1">Welcome, {user.username}</p>}
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
                    ? "bg-blue-50 text-blue-600 font-medium" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-colors"
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
