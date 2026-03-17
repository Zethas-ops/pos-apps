import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Coffee, LayoutDashboard, Receipt, History, Menu, Package, Tag, Settings, LogOut, Users } from "lucide-react";
import { clsx } from "clsx";
function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isAdmin = user.role?.toLowerCase() === "admin";

const permissions = isAdmin
  ? ["pos", "open-bills", "history", "menu", "inventory", "promo", "roles", "settings"]
  : ["pos", "open-bills", "history"];
  
  const allNavItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, id: "dashboard" },
    { name: "New Order", path: "/pos", icon: Coffee, id: "pos" },
    { name: "Open Bills", path: "/open-bills", icon: Receipt, id: "open-bills" },
    { name: "History", path: "/history", icon: History, id: "history" },
    { name: "Menu", path: "/menu", icon: Menu, id: "menu" },
    { name: "Inventory", path: "/inventory", icon: Package, id: "inventory" },
    { name: "Promos", path: "/promo", icon: Tag, id: "promo" },
    { name: "Roles", path: "/roles", icon: Users, id: "roles" },
    { name: "Settings", path: "/settings", icon: Settings, id: "settings" }
  ];

  const navItems = allNavItems.filter(item => item.id === "dashboard" || permissions.includes(item.id));
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };
  return <div className="flex h-screen bg-gray-100">
      {
    /* Sidebar */
  }
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">Coffee POS</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome, {user.name || user.username}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return <Link
      key={item.path}
      to={item.path}
      className={clsx(
        "flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors",
        isActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"
      )}
    >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>;
  })}
        </nav>

        <div className="p-4 border-t">
          <button
    onClick={handleLogout}
    className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-colors"
  >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {
    /* Main Content */
  }
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>;
}
export {
  Layout as default
};
