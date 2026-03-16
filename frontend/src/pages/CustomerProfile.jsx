import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { Users, ArrowLeft, Plus, DollarSign, Activity, FileText, Banknote, ShoppingCart, CheckCircle, Clock, Download, Search, Filter, Eye } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const CustomerProfile = () => {
    const { id } = useParams();
    const [customer, setCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [payments, setPayments] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders'); // Default to Invoice List
    const printRef = useRef();

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({ amount: '', paymentMethod: 'Cash', notes: '' });

    // History Modal State
    const [historyModalProduct, setHistoryModalProduct] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'this_week', 'specific_date', 'date_range'
    const [specificDate, setSpecificDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Invoice List Filter State
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
    const [invoiceDateFilter, setInvoiceDateFilter] = useState('all');
    const [invoiceSpecificDate, setInvoiceSpecificDate] = useState('');
    const [invoiceStartDate, setInvoiceStartDate] = useState('');
    const [invoiceEndDate, setInvoiceEndDate] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [custRes, ordRes, payRes, prodRes] = await Promise.all([
                API.get(`/customers/${id}`),
                API.get(`/orders?customer=${id}`),
                API.get(`/payments?type=customer&referenceId=${id}`),
                API.get(`/customers/${id}/products`)
            ]);
            setCustomer(custRes.data);
            setOrders(ordRes.data);
            setPayments(payRes.data);
            setProducts(prodRes.data);
        } catch (error) {
            console.error('Error fetching customer data', error);
        } finally {
            setLoading(false);
        }
    };

    const openHistoryModal = (product) => {
        setHistoryModalProduct(product);
        setHistoryFilter('all');
        setSpecificDate('');
        setEndDate('');
        fetchHistoryData(product, 'all', '', '');
    };

    const fetchHistoryData = (product, filterType, startDateStr, endDateStr) => {
        // We already have the full recentMovements populated from the backend in the product object!
        let filtered = [...(product.recentMovements || [])];

        if (filterType === 'this_week') {
            const today = new Date();
            const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
            firstDay.setHours(0,0,0,0);
            filtered = filtered.filter(m => new Date(m.date) >= firstDay);
        } else if (filterType === 'specific_date' && startDateStr) {
            const tzDate = new Date(startDateStr);
            const nextDate = new Date(tzDate);
            nextDate.setDate(tzDate.getDate() + 1);
            filtered = filtered.filter(m => {
                const md = new Date(m.date);
                return md >= tzDate && md < nextDate;
            });
        } else if (filterType === 'date_range' && startDateStr && endDateStr) {
            const sd = new Date(startDateStr);
            const ed = new Date(endDateStr);
            ed.setHours(23, 59, 59, 999);
            filtered = filtered.filter(m => {
                const md = new Date(m.date);
                return md >= sd && md <= ed;
            });
        }
        setHistoryData(filtered);
    };

    useEffect(() => {
        if (historyModalProduct) {
            fetchHistoryData(historyModalProduct, historyFilter, specificDate, endDate);
        }
    }, [historyFilter, specificDate, endDate]);

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/payments', {
                type: 'customer',
                referenceId: id,
                amount: Number(paymentData.amount),
                paymentMethod: paymentData.paymentMethod,
                notes: paymentData.notes
            });
            setIsPaymentModalOpen(false);
            setPaymentData({ amount: '', paymentMethod: 'Cash', notes: '' });
            fetchData();
        } catch (error) {
            console.error('Error recording payment', error);
            alert('Failed to record payment');
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Purchase_History_${historyModalProduct?.name || 'Product'}`,
    });

    const filteredOrders = orders.filter(o => {
        const matchesSearch = (o.invoiceNumber || '').toLowerCase().includes(invoiceSearch.toLowerCase());
        const matchesStatus = invoiceStatusFilter === 'all' || o.paymentStatus === invoiceStatusFilter;
        
        let matchesDate = true;
        if (invoiceDateFilter === 'this_week') {
            const today = new Date();
            const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
            firstDay.setHours(0,0,0,0);
            matchesDate = new Date(o.date) >= firstDay;
        } else if (invoiceDateFilter === 'specific_date' && invoiceSpecificDate) {
            const tzDate = new Date(invoiceSpecificDate);
            const nextDate = new Date(tzDate);
            nextDate.setDate(tzDate.getDate() + 1);
            const od = new Date(o.date);
            matchesDate = od >= tzDate && od < nextDate;
        } else if (invoiceDateFilter === 'date_range' && invoiceStartDate && invoiceEndDate) {
            const sd = new Date(invoiceStartDate);
            const ed = new Date(invoiceEndDate);
            ed.setHours(23, 59, 59, 999);
            const od = new Date(o.date);
            matchesDate = od >= sd && od <= ed;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    if (loading) return <div className="text-center py-20"><span className="loading loading-spinner text-primary"></span></div>;
    if (!customer) return <div className="text-center py-20 text-error">Customer not found</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/customers" className="btn btn-ghost btn-circle">
                        <ArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Users className="text-primary" /> {customer.name}
                        </h1>
                        <p className="text-base-content/60 text-sm mt-1 flex items-center gap-4">
                            <span>Phone: {customer.phoneNumber || 'N/A'}</span>
                            <span>Address: {customer.address || 'N/A'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsPaymentModalOpen(true)} className="btn btn-success text-white shadow-lg shadow-success/30">
                        <DollarSign size={18} /> Receive Payment
                    </button>
                    <Link to="/billing" className="btn btn-primary shadow-lg shadow-primary/30">
                        <ShoppingCart size={18} /> New Order
                    </Link>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-5">
                        <div className="flex justify-between items-start">
                            <div className="text-base-content/60 font-medium text-sm">Total Orders</div>
                            <FileText className="text-primary/40" size={20} />
                        </div>
                        <div className="text-2xl font-bold text-primary mt-1">
                            {customer.totalOrders || 0}
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-5">
                        <div className="flex justify-between items-start">
                            <div className="text-base-content/60 font-medium text-sm">Total Purchase Value</div>
                            <Activity className="text-info/40" size={20} />
                        </div>
                        <div className="text-2xl font-bold font-mono text-info mt-1">
                            ₹{(customer.totalPurchaseValue || 0).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-5">
                        <div className="flex justify-between items-start">
                            <div className="text-base-content/60 font-medium text-sm">Total Paid</div>
                            <Banknote className="text-success/40" size={20} />
                        </div>
                        <div className="text-2xl font-bold font-mono text-success mt-1">
                            ₹{(customer.totalPaid || 0).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-sm border border-error/20 bg-error/5">
                    <div className="card-body p-5">
                        <div className="flex justify-between items-start">
                            <div className="text-error/80 font-bold text-sm">Remaining Balance</div>
                            <Users className="text-error/40" size={20} />
                        </div>
                        <div className="text-2xl font-bold font-mono text-error mt-1">
                            ₹{(customer.remainingBalance || 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed bg-base-100 p-1 shadow-sm border border-base-200 inline-flex">
                <button 
                    className={`tab tab-lg ${activeTab === 'orders' ? 'tab-active bg-primary text-primary-content' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Invoice List
                </button>
                <button 
                    className={`tab tab-lg ${activeTab === 'payments' ? 'tab-active bg-primary text-primary-content' : ''}`}
                    onClick={() => setActiveTab('payments')}
                >
                    Payment History
                </button>
            </div>

            {/* Tab Content */}
            <div className="card bg-base-100 shadow-md border border-base-200 mt-4 min-h-[400px]">
                
                {activeTab === 'orders' && (
                    <div className="flex flex-col">
                        {/* Filter Bar */}
                        <div className="p-4 border-b border-base-200 bg-base-50/50 flex flex-wrap gap-4 items-center justify-between z-10">
                            <div className="flex flex-wrap gap-4 items-center flex-1">
                                <div className="join">
                                    <div className="join-item flex items-center px-3 bg-white border border-slate-300 border-r-0 rounded-l-lg">
                                        <Search size={16} className="text-slate-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        className="input join-item input-sm h-10 border-slate-300 focus:outline-none w-64 bg-white" 
                                        placeholder="Search Invoice No..."
                                        value={invoiceSearch}
                                        onChange={(e) => setInvoiceSearch(e.target.value)}
                                    />
                                </div>
                                <div className="join">
                                    <div className="join-item flex items-center px-3 bg-white border border-slate-300 border-r-0 rounded-l-lg">
                                        <Filter size={16} className="text-slate-400" />
                                    </div>
                                    <select 
                                        className="select join-item select-sm h-10 border-slate-300 focus:outline-none bg-white font-medium text-slate-600"
                                        value={invoiceStatusFilter}
                                        onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="paid">Paid</option>
                                        <option value="partial">Partial</option>
                                        <option value="unpaid">Unpaid</option>
                                    </select>
                                </div>
                                
                                {/* Date Filter Dropdown */}
                                <select 
                                    className="select select-sm h-10 border border-slate-300 focus:outline-none bg-white font-medium text-slate-600"
                                    value={invoiceDateFilter}
                                    onChange={(e) => setInvoiceDateFilter(e.target.value)}
                                >
                                    <option value="all">All Dates</option>
                                    <option value="this_week">This Week</option>
                                    <option value="specific_date">Specific Date</option>
                                    <option value="date_range">Date Range</option>
                                </select>

                                {/* Conditional Date Inputs */}
                                {invoiceDateFilter === 'specific_date' && (
                                    <input 
                                        type="date" 
                                        className="input input-sm h-10 border-slate-300 focus:outline-none bg-white font-medium text-slate-600"
                                        value={invoiceSpecificDate}
                                        onChange={(e) => setInvoiceSpecificDate(e.target.value)}
                                    />
                                )}
                                {invoiceDateFilter === 'date_range' && (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="date" 
                                            className="input input-sm h-10 border-slate-300 focus:outline-none bg-white font-medium text-slate-600"
                                            value={invoiceStartDate}
                                            onChange={(e) => setInvoiceStartDate(e.target.value)}
                                        />
                                        <span className="text-slate-400 font-medium">to</span>
                                        <input 
                                            type="date" 
                                            className="input input-sm h-10 border-slate-300 focus:outline-none bg-white font-medium text-slate-600"
                                            value={invoiceEndDate}
                                            onChange={(e) => setInvoiceEndDate(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="text-sm font-semibold text-slate-500 bg-slate-200/50 px-3 py-1.5 rounded-full">
                                {filteredOrders.length} invoices
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr className="bg-base-200 uppercase text-xs">
                                        <th className="py-4 font-bold tracking-wider">Invoice No.</th>
                                        <th className="font-bold tracking-wider">Date</th>
                                        <th className="font-bold tracking-wider">Amount</th>
                                        <th className="font-bold tracking-wider">Status</th>
                                        <th className="font-bold tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(o => (
                                        <tr key={o._id} className="hover">
                                            <td className="font-bold text-primary">{o.invoiceNumber || 'N/A'}</td>
                                            <td>{new Date(o.date).toLocaleDateString()}</td>
                                            <td className="font-mono font-bold">₹{o.totalAmount?.toLocaleString()}</td>
                                            <td>
                                                <div className="flex flex-col items-start gap-1">
                                                    <div className={`badge gap-1 ${o.paymentStatus === 'paid' ? 'badge-success' : o.paymentStatus === 'partial' ? 'badge-warning' : 'badge-error'}`}>
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
                                                <Link 
                                                    to={`/orders/${o._id}`}
                                                    className="btn btn-sm btn-ghost text-primary hover:bg-primary/10 gap-2"
                                                >
                                                    <Eye size={16} /> View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredOrders.length === 0 && (
                                        <tr><td colSpan="5" className="text-center py-12 text-base-content/50">No invoices found matching your filters.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'payments' && (
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="bg-base-200 uppercase text-xs">
                                    <th className="py-4 font-bold tracking-wider">Date</th>
                                    <th className="font-bold tracking-wider">Amount Received</th>
                                    <th className="font-bold tracking-wider">Method</th>
                                    <th className="font-bold tracking-wider">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(p => (
                                    <tr key={p._id} className="hover">
                                        <td>{new Date(p.date).toLocaleDateString()}</td>
                                        <td className="font-mono font-bold text-success">+ ₹{p.amount?.toLocaleString()}</td>
                                        <td><div className="badge badge-outline">{p.paymentMethod}</div></td>
                                        <td className="text-base-content/70 text-sm max-w-xs truncate">{p.notes || '-'}</td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr><td colSpan="4" className="text-center py-12 text-base-content/50">No payments received yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            <dialog className={`modal ${isPaymentModalOpen ? 'modal-open' : ''}`}>
                <div className="modal-box w-11/12 max-w-md bg-base-100">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-success">
                        <DollarSign /> Receive Payment from {customer.name}
                    </h3>
                    <form onSubmit={handlePaymentSubmit}>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text font-semibold">Amount Received (₹) *</span></label>
                            <input 
                                type="number" 
                                required 
                                min="1"
                                className="input input-bordered focus:input-success font-mono font-bold text-lg"
                                value={paymentData.amount}
                                onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text font-semibold">Payment Method *</span></label>
                            <select 
                                required
                                className="select select-bordered focus:select-success"
                                value={paymentData.paymentMethod}
                                onChange={e => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                            >
                                <option>Cash</option>
                                <option>Bank Transfer</option>
                                <option>Cheque</option>
                                <option>UPI</option>
                            </select>
                        </div>
                        <div className="form-control mb-6">
                            <label className="label"><span className="label-text font-semibold">Notes (Optional)</span></label>
                            <input 
                                type="text"
                                className="input input-bordered focus:input-success"
                                placeholder="Txn ID, Cheque No, etc."
                                value={paymentData.notes}
                                onChange={e => setPaymentData({...paymentData, notes: e.target.value})}
                            />
                        </div>
                        <div className="modal-action">
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn btn-ghost">Cancel</button>
                            <button type="submit" className="btn btn-success shadow-lg shadow-success/30 text-white">Record Payment</button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop bg-black/40" onClick={() => setIsPaymentModalOpen(false)}><button>close</button></form>
            </dialog>

            {/* Full Screen History Modal */}
            <dialog className={`modal ${historyModalProduct ? 'modal-open' : ''}`}>
                <div className="modal-box w-11/12 max-w-5xl h-[90vh] max-h-screen flex flex-col p-0 overflow-hidden rounded-2xl shadow-2xl bg-slate-50 border border-slate-200">
                    
                    {/* Modal Header */}
                    <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-start shrink-0 z-20">
                        <div>
                            <h3 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
                                <Activity className="text-primary stroke-[2.5px]" size={28} /> Purchase History
                            </h3>
                            <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2">
                                Product: <span className="font-semibold text-primary">{historyModalProduct?.name}</span>
                                <span className="text-xs opacity-70">(ID: {historyModalProduct?.productId})</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => handlePrint()} className="btn btn-sm btn-outline hover:bg-primary hover:text-white border-slate-300 shadow-sm transition-all gap-2 h-10 px-4 rounded-lg">
                                <Download size={16} />
                                Download PDF
                            </button>
                            <button 
                                className="btn btn-sm btn-circle btn-ghost bg-slate-100 hover:bg-slate-200 text-slate-500" 
                                onClick={() => setHistoryModalProduct(null)}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="p-4 bg-white/60 backdrop-blur border-b border-slate-200 flex flex-wrap gap-4 items-center shrink-0 shadow-sm z-10">
                        <div className="join border border-slate-200 shadow-sm rounded-lg overflow-hidden bg-white">
                            <button 
                                onClick={() => { setHistoryFilter('all'); }} 
                                className={`btn btn-sm join-item h-10 border-0 ${historyFilter === 'all' ? 'bg-primary text-white hover:bg-primary-focus' : 'bg-white hover:bg-slate-50 text-slate-600'}`}
                            >
                                All Time
                            </button>
                            <button 
                                onClick={() => { setHistoryFilter('this_week'); }} 
                                className={`btn btn-sm join-item h-10 border-0 border-l border-slate-200 ${historyFilter === 'this_week' ? 'bg-primary text-white hover:bg-primary-focus' : 'bg-white hover:bg-slate-50 text-slate-600'}`}
                            >
                                This Week
                            </button>
                            <button 
                                onClick={() => { setHistoryFilter('specific_date'); }} 
                                className={`btn btn-sm join-item h-10 border-0 border-l border-slate-200 ${historyFilter === 'specific_date' ? 'bg-primary text-white hover:bg-primary-focus' : 'bg-white hover:bg-slate-50 text-slate-600'}`}
                            >
                                Specific Date
                            </button>
                            <button 
                                onClick={() => { setHistoryFilter('date_range'); }} 
                                className={`btn join-item ${historyFilter === 'date_range' ? 'btn-active btn-primary' : ''}`}
                            >
                                Date Range
                            </button>
                        </div>

                        {historyFilter === 'specific_date' && (
                            <input 
                                type="date" 
                                className="input input-bordered input-sm h-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm border-slate-300 bg-white text-slate-700"
                                value={specificDate}
                                onChange={(e) => setSpecificDate(e.target.value)}
                            />
                        )}

                        {historyFilter === 'date_range' && (
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-300 shadow-sm">
                                <input 
                                    type="date" 
                                    className="input input-sm h-8 border-0 focus:outline-none bg-transparent text-slate-700"
                                    value={specificDate}
                                    onChange={(e) => setSpecificDate(e.target.value)}
                                    placeholder="Start Date"
                                />
                                <span className="font-semibold text-slate-400 text-sm">to</span>
                                <input 
                                    type="date" 
                                    className="input input-sm h-8 border-0 focus:outline-none bg-transparent text-slate-700"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    placeholder="End Date"
                                />
                            </div>
                        )}
                        
                        <div className="ml-auto text-sm font-semibold text-slate-500 bg-slate-200/50 px-3 py-1.5 rounded-full">
                            {historyData.length} records
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="flex-grow overflow-auto bg-slate-50/50 p-4 md:p-6" ref={printRef}>
                        
                        {/* Print-Only Header (Hidden on screen) */}
                        <div className="hidden print:block mb-8 text-center pb-6 border-b border-slate-300">
                            <h1 className="text-3xl font-black text-slate-800 mb-2">Purchase History</h1>
                            <div className="flex justify-center flex-col items-center gap-1 text-slate-600">
                                <p className="font-semibold text-lg">Product: {historyModalProduct?.name} <span className="text-sm opacity-70 font-normal">(ID: {historyModalProduct?.productId})</span></p>
                                <p className="text-sm">Customer: {customer?.name}</p>
                                <p className="text-sm mt-2">Generated on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden printable-table print:shadow-none print:border print:border-slate-300">
                            <table className="table w-full">
                                <thead className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md border-b border-slate-200">
                                    <tr className="uppercase text-[11px] tracking-wider text-slate-500 font-bold">
                                        <th className="py-4 font-bold tracking-wider">Day & Date</th>
                                        <th className="font-bold tracking-wider">Time</th>
                                        <th className="font-bold tracking-wider">Quantity Purchased</th>
                                        <th className="font-bold tracking-wider">Payment Status</th>
                                        <th className="font-bold tracking-wider print:hidden">Context / Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyData.map(m => {
                                        const d = new Date(m.date);
                                        return (
                                            <tr key={m._id} className="hover:bg-slate-50/80 border-b border-slate-100 last:border-0 transition-colors duration-200">
                                                <td className="font-semibold text-slate-700 py-4">
                                                    {d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </td>
                                                <td className="font-mono text-slate-400 text-xs">
                                                    {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td>
                                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 shadow-sm inline-block">
                                                        +{Math.abs(m.quantity).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td>
                                                    {m.orderDetails ? (
                                                        <div className="flex flex-col items-start gap-1">
                                                            <div className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border shadow-sm ${
                                                                m.orderDetails.paymentStatus === 'paid' 
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                                    : m.orderDetails.paymentStatus === 'partial' 
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                                            }`}>
                                                                {m.orderDetails.paymentStatus}
                                                            </div>
                                                            {m.orderDetails.paymentStatus === 'partial' && (
                                                                <div className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                                    Remain: ₹{((m.orderDetails.totalAmount || 0) - (m.orderDetails.amountPaid || 0)).toLocaleString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 italic">-</span>
                                                    )}
                                                </td>
                                                <td className="text-sm text-slate-500 print:hidden leading-relaxed">
                                                    Sales record via Order invoice: {m.referenceId || 'N/A'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {historyData.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center py-20 text-base-content/40 print:col-span-4">
                                                <Activity className="mx-auto mb-4 opacity-20" size={32} />
                                                <p>No purchase records found for the selected time period.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={() => setHistoryModalProduct(null)}><button>close</button></form>
            </dialog>
        </div>
    );
};

export default CustomerProfile;
