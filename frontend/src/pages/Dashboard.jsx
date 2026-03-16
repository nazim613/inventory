import { useState, useEffect } from 'react';
import API from '../api/axios';
import { Package, Factory, Users, Container, AlertTriangle, FileText, Banknote, Activity, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-[80vh]"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  return (
    <div className="pb-10">
      <h1 className="text-3xl font-bold mb-8">Business Dashboard</h1>

      {/* Financial Stats Cards */}
      <h2 className="text-xl font-bold mb-4 opacity-70">Financial Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat bg-primary text-primary-content shadow-lg shadow-primary/30 rounded-2xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-20"><TrendingUp size={120} /></div>
          <div className="stat-figure text-primary-content opacity-80"><Banknote size={36} /></div>
          <div className="stat-title text-primary-content/80 font-medium">Total Lifetime Sales</div>
          <div className="stat-value font-mono mt-1">₹{stats.totalRevenue?.toLocaleString()}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-5"><Activity size={120} /></div>
          <div className="stat-figure text-info"><Users size={36} /></div>
          <div className="stat-title text-base-content/60 font-medium pb-1 border-b border-base-200">Customer Dues (Receivable)</div>
          <div className="stat-value text-info mt-2 font-mono tracking-tight">₹{stats.pendingCustomerPayments?.toLocaleString()}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-5"><Activity size={120} /></div>
          <div className="stat-figure text-error"><Factory size={36} /></div>
          <div className="stat-title text-base-content/60 font-medium pb-1 border-b border-base-200">Manufacturer Dues (Payable)</div>
          <div className="stat-value text-error mt-2 font-mono tracking-tight">₹{stats.pendingManufacturerPayments?.toLocaleString()}</div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 opacity-70">Inventory & System</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl">
          <div className="stat-figure text-secondary bg-secondary/10 p-3 rounded-full"><Package size={24} /></div>
          <div className="stat-title">Catalog Products</div>
          <div className="stat-value text-2xl mt-1">{stats.totalProducts}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl">
          <div className="stat-figure text-accent bg-accent/10 p-3 rounded-full"><Factory size={24} /></div>
          <div className="stat-title">Manufacturers</div>
          <div className="stat-value text-2xl mt-1">{stats.totalManufacturers}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl">
          <div className="stat-figure text-success bg-success/10 p-3 rounded-full"><Users size={24} /></div>
          <div className="stat-title">Active Customers</div>
          <div className="stat-value text-2xl mt-1">{stats.totalCustomers}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl">
          <div className="stat-figure text-warning bg-warning/10 p-3 rounded-full"><Container size={24} /></div>
          <div className="stat-title">Units in Stock</div>
          <div className="stat-value text-2xl mt-1">{stats.totalStock}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Invoices */}
        <div className="card bg-base-100 shadow-md border border-base-200 lg:col-span-2">
          <div className="card-body p-6">
            <div className="flex justify-between items-center border-b border-base-200 pb-4 mb-4">
               <h2 className="card-title text-lg flex items-center gap-2">
                 <FileText size={20} className="text-primary" /> Recent Sales Invoices
               </h2>
               <Link to="/orders" className="btn btn-sm btn-ghost">View All</Link>
            </div>
            
            {stats.recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <FileText size={48} className="mb-4" />
                    <p>No recent orders found.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                    <tr className="uppercase text-xs tracking-wider">
                        <th>Invoice</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {stats.recentOrders.map((order) => (
                        <tr key={order._id} className="hover">
                        <td className="font-bold text-primary">{order.invoiceNumber || '-'}</td>
                        <td className="font-medium">{order.customer?.name || 'Unknown'}</td>
                        <td className="font-mono font-bold text-base">₹{order.totalAmount?.toLocaleString()}</td>
                        <td>
                            <div className={`badge badge-sm uppercase text-[10px] font-bold ${order.paymentStatus === 'paid' ? 'badge-success' : order.paymentStatus === 'partial' ? 'badge-warning' : 'badge-error'}`}>
                                {order.paymentStatus || 'unpaid'}
                            </div>
                        </td>
                        <td className="text-base-content/70">{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card shadow-md border border-error/20 bg-gradient-to-br from-base-100 to-error/5">
          <div className="card-body p-6">
            <div className="flex justify-between items-center border-b border-error/10 pb-4 mb-4">
                <h2 className="card-title text-error text-lg flex items-center gap-2">
                    <AlertTriangle size={20} /> Low Stock Alerts
                </h2>
                <div className="badge badge-error gap-1">{stats.lowStockAlerts.length} items</div>
            </div>
            {stats.lowStockAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-70">
                    <Container size={48} className="mb-4 text-success" />
                    <p className="text-success font-medium">All stock levels are optimal!</p>
                </div>
            ) : (
                <ul className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {stats.lowStockAlerts.map((alert, i) => (
                    <li key={i} className="flex justify-between items-center p-3 bg-base-100 shadow-sm border border-error/20 rounded-xl hover:border-error/50 transition-colors">
                    <div>
                        <div className="font-bold text-sm">{alert.productName}</div> 
                        <div className="text-xs text-base-content/60 mt-1">Size: {alert.size}</div>
                    </div>
                    <div className="text-right">
                        <div className="font-mono font-bold text-error text-lg">{alert.quantity}</div>
                        <div className="text-[10px] text-base-content/50 uppercase">{alert.unitType}s left</div>
                    </div>
                    </li>
                ))}
                </ul>
            )}
            <div className="mt-6">
                <Link to="/stocks" className="btn btn-error w-full shadow-lg shadow-error/20 text-white">Manage Stock</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
