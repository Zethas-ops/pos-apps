/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import OpenBills from "./pages/OpenBills";
import MenuManagement from "./pages/MenuManagement";
import Inventory from "./pages/Inventory";
import History from "./pages/History";
import Promo from "./pages/Promo";
import Settings from "./pages/Settings";
import RoleManagement from "./pages/RoleManagement";
import Layout from "./components/Layout";
function PrivateRoute({ children, requirePermission }) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  if (!token || !userStr) {
    return <Navigate to="/login" />;
  }
  const user = JSON.parse(userStr);
  const permissions = user.permissions || (user.role === "ADMIN" ? ["pos", "open-bills", "history", "menu", "inventory", "promo", "roles", "settings"] : ["pos", "open-bills", "history"]);
  
  if (requirePermission && !permissions.includes(requirePermission)) {
    return <Navigate to="/" />;
  }
  return children;
}
function App() {
  return <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<PrivateRoute requirePermission="pos"><POS /></PrivateRoute>} />
          <Route path="open-bills" element={<PrivateRoute requirePermission="open-bills"><OpenBills /></PrivateRoute>} />
          <Route path="history" element={<PrivateRoute requirePermission="history"><History /></PrivateRoute>} />
          
          <Route path="menu" element={<PrivateRoute requirePermission="menu"><MenuManagement /></PrivateRoute>} />
          <Route path="inventory" element={<PrivateRoute requirePermission="inventory"><Inventory /></PrivateRoute>} />
          <Route path="promo" element={<PrivateRoute requirePermission="promo"><Promo /></PrivateRoute>} />
          <Route path="roles" element={<PrivateRoute requirePermission="roles"><RoleManagement /></PrivateRoute>} />
          <Route path="settings" element={<PrivateRoute requirePermission="settings"><Settings /></PrivateRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>;
}
export {
  App as default
};
