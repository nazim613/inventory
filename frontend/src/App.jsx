import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Manufacturers from './pages/Manufacturers';
import ManufacturerProfile from './pages/ManufacturerProfile';
import Purchases from './pages/Purchases';
import AddPurchase from './pages/AddPurchase';
import PurchaseDetail from './pages/PurchaseDetail';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import Products from './pages/Products';
import Stocks from './pages/Stocks';
import Billing from './pages/Billing';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import useAuthStore from './store/authStore';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'superadmin') {
      return <Navigate to="/superadmin" replace />;
  }
  return children;
};

const SuperAdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (!user || user.role !== 'superadmin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="manufacturers" element={<Manufacturers />} />
          <Route path="manufacturers/:id" element={<ManufacturerProfile />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="purchases/new" element={<AddPurchase />} />
          <Route path="purchases/:id" element={<PurchaseDetail />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerProfile />} />
          <Route path="products" element={<Products />} />
          <Route path="stocks" element={<Stocks />} />
          <Route path="billing" element={<Billing />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
