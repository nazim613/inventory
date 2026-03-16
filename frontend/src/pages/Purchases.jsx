import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { ShoppingBag, Search, Plus, Eye, CheckCircle, Clock, Filter } from 'lucide-react';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [specificDate, setSpecificDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data } = await API.get('/purchases');
      setPurchases(data);
    } catch (error) {
      console.error('Error fetching purchases', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = purchases.filter(p => {
    const matchesSearch = p.purchaseId?.toLowerCase().includes(search.toLowerCase()) || 
                          (p.manufacturer?.name && p.manufacturer.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.paymentStatus === statusFilter;
    
    let matchesDate = true;
    if (dateFilter === 'this_week') {
        const today = new Date();
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        firstDay.setHours(0,0,0,0);
        matchesDate = new Date(p.date) >= firstDay;
    } else if (dateFilter === 'specific_date' && specificDate) {
        const tzDate = new Date(specificDate);
        const nextDate = new Date(tzDate);
        nextDate.setDate(tzDate.getDate() + 1);
        const pd = new Date(p.date);
        matchesDate = pd >= tzDate && pd < nextDate;
    } else if (dateFilter === 'date_range' && startDate && endDate) {
        const sd = new Date(startDate);
        const ed = new Date(endDate);
        ed.setHours(23, 59, 59, 999);
        const pd = new Date(p.date);
        matchesDate = pd >= sd && pd <= ed;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingBag className="text-primary" /> Purchases
        </h1>
        <Link to="/purchases/new" className="btn btn-primary shadow-lg shadow-primary/30">
          <Plus size={20} /> New Purchase
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
                        placeholder="Search by ID or manufacturer..."
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
                        <option value="pending">Pending</option>
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
                {filtered.length} purchases
            </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-md border border-base-200">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200 text-base-content uppercase text-xs tracking-wider">
                <th className="font-bold py-4">Purchase ID</th>
                <th className="font-bold">Date</th>
                <th className="font-bold">Manufacturer</th>
                <th className="font-bold">Amount</th>
                <th className="font-bold">Status</th>
                <th className="text-right font-bold py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id} className="hover">
                  <td className="font-bold text-primary">{p.purchaseId}</td>
                  <td>{new Date(p.date).toLocaleDateString()}</td>
                  <td>
                      <Link to={`/manufacturers/${p.manufacturer?._id}`} className="hover:underline font-semibold">
                          {p.manufacturer?.name || 'Unknown'}
                      </Link>
                  </td>
                  <td className="font-mono font-bold">₹{p.totalAmount?.toLocaleString()}</td>
                  <td>
                    {p.paymentStatus === 'paid' ? (
                        <div className="badge badge-success gap-1"><CheckCircle size={12}/> Paid</div>
                    ) : p.paymentStatus === 'partial' ? (
                        <div className="flex flex-col items-start gap-1">
                            <div className="badge badge-warning gap-1"><Clock size={12}/> Partial</div>
                            <div className="text-[10px] text-base-content/60 font-semibold bg-base-200 px-1.5 py-0.5 rounded">
                                Remain: ₹{((p.totalAmount || 0) - (p.amountPaid || 0)).toLocaleString()}
                            </div>
                        </div>
                    ) : (
                        <div className="badge badge-error gap-1 text-white"><Clock size={12}/> Pending</div>
                    )}
                  </td>
                  <td className="text-right">
                      {/* View details */}
                      <Link to={`/purchases/${p._id}`} className="btn btn-sm btn-ghost text-info hover:bg-info hover:text-white" title="View Details">
                          <Eye size={16} /> View
                      </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                  <tr>
                      <td colSpan="6" className="text-center py-10 text-base-content/60 flex flex-col items-center">
                          <ShoppingBag size={48} className="mb-4 opacity-20" />
                          <p>No purchases found.</p>
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

export default Purchases;
