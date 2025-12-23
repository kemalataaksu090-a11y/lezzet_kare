import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import CustomerView from './components/CustomerView';
import CashierDashboard from './components/CashierDashboard';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import OrderStatusView from './components/OrderStatusView';
import OrderHistoryView from './components/OrderHistoryView';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/table/:tableId" element={<CustomerView />} />
        <Route path="/table/:tableId/history" element={<OrderHistoryView />} />
        <Route path="/order/:orderId" element={<OrderStatusView />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <CashierDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </HashRouter>
  );
};

export default App;