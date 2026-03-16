/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import OpenBills from './pages/OpenBills';
import MenuManagement from './pages/MenuManagement';
import Inventory from './pages/Inventory';
import History from './pages/History';
import Promo from './pages/Promo';
import Settings from './pages/Settings';
import RoleManagement from './pages/RoleManagement';
import Layout from './components/Layout';

function PrivateRoute({ children, requireAdmin }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" />;
  }

  const user = JSON.parse(userStr);
  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/" />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="open-bills" element={<OpenBills />} />
          <Route path="history" element={<History />} />
          
          {/* Admin Only Routes */}
          <Route path="menu" element={<PrivateRoute requireAdmin><MenuManagement /></PrivateRoute>} />
          <Route path="inventory" element={<PrivateRoute requireAdmin><Inventory /></PrivateRoute>} />
          <Route path="promo" element={<PrivateRoute requireAdmin><Promo /></PrivateRoute>} />
          <Route path="roles" element={<PrivateRoute requireAdmin><RoleManagement /></PrivateRoute>} />
          <Route path="settings" element={<PrivateRoute requireAdmin><Settings /></PrivateRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
