import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Factory, Package, Container, FileText, Settings as SettingsIcon, LogOut, ShoppingBag } from 'lucide-react';
import useAuthStore from '../store/authStore';
import API from '../api/axios';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [companyName, setCompanyName] = useState('Padlock Sys');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await API.get('/settings');
        if (data?.companyName) {
          setCompanyName(data.companyName);
        }
      } catch (error) {
        console.error('Error fetching settings for layout', error);
      }
    };
    fetchSettings();
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Manufacturers', href: '/manufacturers', icon: Factory },
    { name: 'Purchases', href: '/purchases', icon: ShoppingBag },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Stocks', href: '/stocks', icon: Container },
    { name: 'Generate Bill', href: '/billing', icon: FileText },
    { name: 'Sales Invoices', href: '/orders', icon: FileText },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col min-h-screen bg-base-200">
        <div className="w-full navbar bg-base-100 lg:hidden shadow-sm">
          <div className="flex-none">
            <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost drawer-button lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </label>
          </div>
          <div className="flex-1 px-2 mx-2 font-bold text-xl text-primary truncate">{companyName}</div>
        </div>

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div> 
      <div className="drawer-side z-40">
        <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label> 
        <ul className="menu p-4 w-72 min-h-full bg-base-100 text-base-content border-r border-base-300">
          <div className="flex items-center gap-2 px-4 py-6 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-content font-bold text-xl shadow-lg border-2 border-primary-content shrink-0">
              {companyName ? companyName.charAt(0).toUpperCase() : 'P'}
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary truncate">{companyName}</h1>
          </div>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.href);
            return (
              <li key={item.name} className="mb-1">
                <Link 
                  to={item.href} 
                  className={`flex gap-4 p-3 rounded-lg font-medium transition-all ${isActive ? 'bg-primary text-primary-content shadow-md shadow-primary/30' : 'hover:bg-base-200'}`}
                >
                  <Icon size={20} className={isActive ? "text-primary-content" : "text-base-content/70"} />
                  {item.name}
                </Link>
              </li>
            );
          })}
          <div className="mt-auto pt-4 border-t border-base-300">
            <li>
               <button onClick={handleLogout} className="flex gap-4 p-3 rounded-lg font-medium text-error hover:bg-error/10 hover:text-error transition-all w-full text-left">
                  <LogOut size={20} />
                  Logout
               </button>
            </li>
          </div>
        </ul>
      </div>
    </div>
  );
};

export default Layout;
