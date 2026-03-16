import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { FileText, Search, Plus, Eye, CheckCircle, Clock, Filter } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [specificDate, setSpecificDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await API.get('/orders');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter(o => {
    const matchesSearch = (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(search.toLowerCase())) || 
                          (o.customer?.name && o.customer.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || o.paymentStatus === statusFilter;
    
    let matchesDate = true;
    if (dateFilter === 'this_week') {
        const today = new Date();
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        firstDay.setHours(0,0,0,0);
        matchesDate = new Date(o.date) >= firstDay;
    } else if (dateFilter === 'specific_date' && specificDate) {
        const tzDate = new Date(specificDate);
        const nextDate = new Date(tzDate);
        nextDate.setDate(tzDate.getDate() + 1);
        const od = new Date(o.date);
        matchesDate = od >= tzDate && od < nextDate;
    } else if (dateFilter === 'date_range' && startDate && endDate) {
        const sd = new Date(startDate);
        const ed = new Date(endDate);
        ed.setHours(23, 59, 59, 999);
        const od = new Date(o.date);
        matchesDate = od >= sd && od <= ed;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="text-primary" /> Sales Invoices
        </h1>
        <Link to="/billing" className="btn btn-primary shadow-lg shadow-primary/30">
          <Plus size={20} /> Create Invoice
        </Link>
      </div>

      <div className="card bg-base-100 shadow-md border border-base-200 mb-6">
        <div className="p-4 bg-base-50/50 flex flex-wrap gap-4 items-center justify-between z-10">
            <div className="flex flex-wrap gap-4 items-center flex-1">
                {/* Search */}
                <div className="join">
                    <div className="join-item flex items-center px-3 bg-white border border-slate-300 border-r-0 rounded-l-lg">
                        <Search size={16} className="text-slate-400" />
                    </div>
                    <input 
                        type="text" 
                        className="input join-item input-sm h-10 border-slate-300 focus:outline-none w-64 bg-white" 
                        placeholder="Search invoice number or customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                {/* Status Filter Dropdown */}
                <div className="join">
                    <div className="join-item flex items-center px-3 bg-white border border-slate-300 border-r-0 rounded-l-lg">
                        <Filter size={16} className="text-slate-400" />
                    </div>
                    <select 
                        className="select join-item select-sm h-10 border-slate-300 focus:outline-none bg-white font-medium text-slate-600"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="unpaid">Unpaid</option>
                    </select>
                </div>
                
                {/* Date Filter Dropdown */}
                <select 
                    className="select select-sm h-10 border border-slate-300 focus:outline-none bg-white font-medium text-slate-600 rounded-lg"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                >
                    <option value="all">All Dates</option>
                    <option value="this_week">This Week</option>
                    <option value="specific_date">Specific Date</option>
                    <option value="date_range">Date Range</option>
                </select>

                {/* Conditional Date Inputs */}
                {dateFilter === 'specific_date' && (
                    <input 
                        type="date" 
                        className="input input-sm h-10 border-slate-300 focus:outline-none bg-white font-medium text-slate-600 rounded-lg"
                        value={specificDate}
                        onChange={(e) => setSpecificDate(e.target.value)}
                    />
                )}
                {dateFilter === 'date_range' && (
                    <div className="flex items-center gap-2">
                        <input 
                            type="date" 
                            className="input input-sm h-10 border-slate-300 focus:outline-none bg-white font-medium text-slate-600 rounded-lg"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-slate-400 font-medium">to</span>
                        <input 
                            type="date" 
                            className="input input-sm h-10 border-slate-300 focus:outline-none bg-white font-medium text-slate-600 rounded-lg"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                )}
            </div>
            
            <div className="text-sm font-semibold text-slate-500 bg-slate-200/50 px-3 py-1.5 rounded-full">
                {filtered.length} invoices
            </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-md border border-base-200 min-h-[400px]">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200 text-base-content uppercase text-xs tracking-wider">
                <th className="font-bold py-4">Invoice No.</th>
                <th className="font-bold">Date</th>
                <th className="font-bold">Customer</th>
                <th className="font-bold">Amount</th>
                <th className="font-bold">Status</th>
                <th className="text-right font-bold py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o._id} className="hover">
                  <td className="font-bold text-primary">{o.invoiceNumber || 'N/A'}</td>
                  <td>{new Date(o.date).toLocaleDateString()}</td>
                  <td>
                      <Link to={`/customers/${o.customer?._id}`} className="hover:underline font-semibold">
                          {o.customer?.name || 'Unknown'}
                      </Link>
                  </td>
                  <td className="font-mono font-bold text-lg">₹{o.totalAmount?.toLocaleString()}</td>
                  <td>
                    <div className="flex flex-col items-start gap-1">
                        <div className={`badge gap-1 ${o.paymentStatus === 'paid' ? 'badge-success' : o.paymentStatus === 'partial' ? 'badge-warning' : 'badge-error text-white'}`}>
                            {o.paymentStatus === 'paid' && <CheckCircle size={12}/>}
                            {o.paymentStatus !== 'paid' && <Clock size={12}/>}
                            {o.paymentStatus || 'unpaid'}
                        </div>
                        {o.paymentStatus === 'partial' && (
                            <div className="text-[10px] text-base-content/60 font-semibold bg-base-200 px-1.5 py-0.5 rounded">
                                Remain: ₹{((o.totalAmount || 0) - (o.amountPaid || 0)).toLocaleString()}
                            </div>
                        )}
                    </div>
                  </td>
                  <td className="text-right">
                      <Link to={`/orders/${o._id}`} className="btn btn-sm btn-ghost text-info hover:bg-info hover:text-white" title="View Details">
                          <Eye size={16} /> View
                      </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                  <tr>
                      <td colSpan="6" className="text-center py-10 text-base-content/60 flex flex-col items-center">
                          <FileText size={48} className="mb-4 opacity-20" />
                          <p>No invoices found.</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
