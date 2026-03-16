import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { Factory, ArrowLeft, Plus, DollarSign, Activity, ShoppingBag, Banknote, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const ManufacturerProfile = () => {
    const { id } = useParams();
    const [manufacturer, setManufacturer] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [payments, setPayments] = useState([]);
    const [products, setProducts] = useState([]);
    const [expandedProduct, setExpandedProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('products');
    const printRef = useRef();

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({ amount: '', paymentMethod: 'Bank Transfer', notes: '' });

    // History Modal State
    const [historyModalProduct, setHistoryModalProduct] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'this_week', 'specific_date', 'date_range'
    const [specificDate, setSpecificDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [mfrRes, purRes, payRes, prodRes] = await Promise.all([
                API.get(`/manufacturers/${id}`),
                API.get(`/purchases?manufacturer=${id}`),
                API.get(`/payments?type=manufacturer&referenceId=${id}`),
                API.get(`/manufacturers/${id}/products`)
            ]);
            setManufacturer(mfrRes.data);
            setPurchases(purRes.data);
            setPayments(payRes.data);
            setProducts(prodRes.data);
        } catch (error) {
            console.error('Error fetching manufacturer data', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/payments', {
                type: 'manufacturer',
                referenceId: id,
                amount: Number(paymentData.amount),
                paymentMethod: paymentData.paymentMethod,
                notes: paymentData.notes
            });
            setIsPaymentModalOpen(false);
            setPaymentData({ amount: '', paymentMethod: 'Bank Transfer', notes: '' });
            fetchData(); // refresh balances and history
        } catch (error) {
            console.error('Error recording payment', error);
            alert('Failed to record payment');
        }
    };

    const openHistoryModal = (product) => {
        setHistoryModalProduct(product);
        setHistoryFilter('all');
        setSpecificDate('');
        setEndDate('');
        fetchHistoryData(product._id, 'all', '', '');
    };

    const fetchHistoryData = async (productId, filterType, startDateStr, endDateStr) => {
        setHistoryLoading(true);
        try {
            let url = `/inventory?productId=${productId}`;
            
            if (filterType === 'this_week') {
                const today = new Date();
                const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
                firstDay.setHours(0,0,0,0);
                url += `&startDate=${firstDay.toISOString()}`;
            } else if (filterType === 'specific_date' && startDateStr) {
                url += `&startDate=${startDateStr}&endDate=${startDateStr}`;
            } else if (filterType === 'date_range' && startDateStr && endDateStr) {
                url += `&startDate=${startDateStr}&endDate=${endDateStr}`;
            }

            const res = await API.get(url);
            // Since we only care about incoming goods for the manufacturer view
            // let's explicitly filter them on the frontend or backend (already kinda done by backend, but let's be safe).
            const incoming = res.data.filter(m => m.quantity > 0 && ['purchase', 'adjustment'].includes(m.type));
            setHistoryData(incoming);
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (historyModalProduct) {
            fetchHistoryData(historyModalProduct._id, historyFilter, specificDate, endDate);
        }
    }, [historyFilter, specificDate, endDate]);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Stock_History_${historyModalProduct?.name || 'Product'}`,
    });

    if (loading) return <div className="text-center py-20"><span className="loading loading-spinner text-primary"></span></div>;
    if (!manufacturer) return <div className="text-center py-20 text-error">Manufacturer not found</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/manufacturers" className="btn btn-ghost btn-circle">
                        <ArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Factory className="text-primary" /> {manufacturer.name}
                        </h1>
                        <p className="text-base-content/60 text-sm mt-1 flex items-center gap-4">
                            <span>Phone: {manufacturer.phoneNumber || 'N/A'}</span>
                            <span>Brand: {manufacturer.brandName || 'N/A'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsPaymentModalOpen(true)} className="btn btn-success text-white shadow-lg shadow-success/30">
                        <DollarSign size={18} /> Record Payment
                    </button>
                    <Link to="/purchases/new" className="btn btn-primary shadow-lg shadow-primary/30">
                        <ShoppingBag size={18} /> New Purchase
                    </Link>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-6">
                        <div className="flex justify-between items-start">
                            <div className="text-base-content/60 font-medium">Total Purchases</div>
                            <Activity className="text-primary/40" size={24} />
                        </div>
                        <div className="text-3xl font-bold font-mono text-primary mt-2">
                            ₹{(manufacturer.totalPurchases || 0).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-6">
                        <div className="flex justify-between items-start">
                            <div className="text-base-content/60 font-medium">Total Paid</div>
                            <Banknote className="text-success/40" size={24} />
                        </div>
                        <div className="text-3xl font-bold font-mono text-success mt-2">
                            ₹{(manufacturer.totalPaid || 0).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-sm border border-error/20 bg-error/5">
                    <div className="card-body p-6">
                        <div className="flex justify-between items-start">
                            <div className="text-error/80 font-bold">Pending Balance</div>
                            <Factory className="text-error/40" size={24} />
                        </div>
                        <div className="text-3xl font-bold font-mono text-error mt-2">
                            ₹{(manufacturer.pendingBalance || 0).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-sm border border-info/20 bg-info/5">
                    <div className="card-body p-6">
                        <div className="flex justify-between items-start">
                            <div className="text-info/80 font-bold">Advance Paid</div>
                            <Banknote className="text-info/40" size={24} />
                        </div>
                        <div className="text-3xl font-bold font-mono text-info mt-2">
                            ₹{Math.max(0, (manufacturer.totalPaid || 0) - (manufacturer.totalPurchases || 0)).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed bg-base-100 p-1 shadow-sm border border-base-200 inline-flex">
                <button 
                    className={`tab tab-lg ${activeTab === 'products' ? 'tab-active bg-primary text-primary-content' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    Products & Stock
                </button>
                <button 
                    className={`tab tab-lg ${activeTab === 'purchases' ? 'tab-active bg-primary text-primary-content' : ''}`}
                    onClick={() => setActiveTab('purchases')}
                >
                    Purchase History
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
                {activeTab === 'products' && (
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="bg-base-200 uppercase text-xs">
                                    <th className="py-4 font-bold tracking-wider">Product ID</th>
                                    <th className="font-bold tracking-wider">Name</th>
                                    <th className="font-bold tracking-wider">Sizes</th>
                                    <th className="font-bold tracking-wider text-right">Price (₹)</th>
                                    <th className="font-bold tracking-wider text-center">Current Total Stock</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p._id} className="hover">
                                        <td className="font-bold text-primary">{p.productId}</td>
                                        <td className="font-semibold">{p.name}</td>
                                        <td className="text-sm text-base-content/70">
                                            {p.stockInfo.sizes.length > 0 ? (
                                                p.stockInfo.sizes.map((s, idx) => (
                                                    <div key={idx} className="mb-1">
                                                        <span className="badge badge-ghost badge-sm mr-2">{s.size}</span>
                                                        <span className="font-mono">{s.quantity} {s.unit}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-base-content/40 italic">No specific sizes tracked</span>
                                            )}
                                        </td>
                                        <td className="font-mono font-bold text-right text-success">₹{(p.manufacturerPrice || 0).toFixed(2)}</td>
                                        <td className="text-center">
                                            <div className={`badge badge-lg ${p.stockInfo.totalQuantity > 0 ? 'badge-primary' : 'badge-error'}`}>
                                                {p.stockInfo.totalQuantity} items
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <button onClick={() => openHistoryModal(p)} className="btn btn-sm btn-outline btn-primary">
                                                View Complete History
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr><td colSpan="6" className="text-center py-12 text-base-content/50">No products assigned to this manufacturer.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'purchases' && (
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="bg-base-200 uppercase text-xs">
                                    <th className="py-4 font-bold tracking-wider">Purchase ID</th>
                                    <th className="font-bold tracking-wider">Date</th>
                                    <th className="font-bold tracking-wider">Items</th>
                                    <th className="font-bold tracking-wider">Amount</th>
                                    <th className="font-bold tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map(p => (
                                    <tr key={p._id} className="hover">
                                        <td className="font-bold text-primary">{p.purchaseId}</td>
                                        <td>
                                            <div className="font-semibold">{new Date(p.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                                            <div className="text-xs text-base-content/60">{new Date(p.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td>{p.products.length} types</td>
                                        <td className="font-mono font-bold">₹{p.totalAmount?.toLocaleString()}</td>
                                        <td>
                                            <div className="flex flex-col items-start gap-1">
                                                <div className={`badge ${p.paymentStatus === 'paid' ? 'badge-success' : p.paymentStatus === 'partial' ? 'badge-warning' : 'badge-error'}`}>
                                                    {p.paymentStatus}
                                                </div>
                                                {p.paymentStatus === 'partial' && (
                                                    <div className="text-[10px] text-base-content/60 font-semibold bg-base-200 px-1.5 py-0.5 rounded">
                                                        Remain: ₹{((p.totalAmount || 0) - (p.amountPaid || 0)).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {purchases.length === 0 && (
                                    <tr><td colSpan="5" className="text-center py-12 text-base-content/50">No purchases yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {activeTab === 'payments' && (
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="bg-base-200 uppercase text-xs">
                                    <th className="py-4 font-bold tracking-wider">Date</th>
                                    <th className="font-bold tracking-wider">Amount</th>
                                    <th className="font-bold tracking-wider">Method</th>
                                    <th className="font-bold tracking-wider">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(p => (
                                    <tr key={p._id} className="hover">
                                        <td>
                                            <div className="font-semibold">{new Date(p.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                                            <div className="text-xs text-base-content/60">{new Date(p.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="font-mono font-bold text-success">+ ₹{p.amount?.toLocaleString()}</td>
                                        <td><div className="badge badge-outline">{p.paymentMethod}</div></td>
                                        <td className="text-base-content/70 text-sm max-w-xs truncate">{p.notes || '-'}</td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr><td colSpan="4" className="text-center py-12 text-base-content/50">No payments recorded yet</td></tr>
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
                        <DollarSign /> Record Payment to {manufacturer.name}
                    </h3>
                    <form onSubmit={handlePaymentSubmit}>
                        <div className="form-control mb-4">
                            <label className="label"><span className="label-text font-semibold">Amount (₹) *</span></label>
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
                                <option>Bank Transfer</option>
                                <option>Cash</option>
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
                    {/* Header */}
                    <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-start shrink-0 z-20">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
                                <Activity className="text-primary stroke-[2.5px]"/> 
                                Stock Arrival History
                            </h2>
                            <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2">
                                Product: <span className="text-primary font-bold">{historyModalProduct?.name}</span>
                                <span className="text-xs opacity-70">(ID: {historyModalProduct?.productId})</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => handlePrint()} className="btn btn-sm btn-outline hover:bg-primary hover:text-white border-slate-300 shadow-sm transition-all gap-2 h-10 px-4 rounded-lg">
                                <Download size={16} />
                                Download PDF
                            </button>
                            <button onClick={() => setHistoryModalProduct(null)} className="btn btn-sm btn-circle btn-ghost bg-slate-100 hover:bg-slate-200 text-slate-500">✕</button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="p-4 bg-white/60 backdrop-blur border-b border-slate-200 flex flex-wrap gap-4 items-center shadow-sm shrink-0 z-10">
                        <div className="join border border-slate-200 shadow-sm rounded-lg overflow-hidden bg-white">
                            <button 
                                onClick={() => setHistoryFilter('all')} 
                                className={`btn btn-sm join-item h-10 border-0 ${historyFilter === 'all' ? 'bg-primary text-white hover:bg-primary-focus' : 'bg-white hover:bg-slate-50 text-slate-600'}`}
                            >
                                All Time
                            </button>
                            <button 
                                onClick={() => setHistoryFilter('this_week')} 
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
                                className={`btn btn-sm join-item h-10 border-0 border-l border-slate-200 ${historyFilter === 'date_range' ? 'bg-primary text-white hover:bg-primary-focus' : 'bg-white hover:bg-slate-50 text-slate-600'}`}
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

                    {/* Table Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50" ref={printRef}>
                        
                        {/* Print-Only Header (Hidden on screen) */}
                        <div className="hidden print:block mb-8 text-center pb-6 border-b border-slate-300">
                            <h1 className="text-3xl font-black text-slate-800 mb-2">Stock Arrival History</h1>
                            <div className="flex justify-center flex-col items-center gap-1 text-slate-600">
                                <p className="font-semibold text-lg">Product: {historyModalProduct?.name} <span className="text-sm opacity-70 font-normal">(ID: {historyModalProduct?.productId})</span></p>
                                <p className="text-sm">Manufacturer: {manufacturer?.name}</p>
                                <p className="text-sm mt-2">Generated on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden printable-table print:shadow-none print:border print:border-slate-300">
                            {historyLoading ? (
                                <div className="p-20 text-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>
                            ) : (
                                <table className="table w-full">
                                    <thead className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md border-b border-slate-200">
                                        <tr className="uppercase text-[11px] tracking-wider text-slate-500 font-bold">
                                            <th className="py-4">Day & Date</th>
                                            <th>Time</th>
                                            <th>Quantity Arrived</th>
                                            <th>Payment Status</th>
                                            <th className="print:hidden">Context / Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyData.map(m => (
                                            <tr key={m._id} className="hover:bg-slate-50/80 border-b border-slate-100 last:border-0 transition-colors duration-200">
                                                <td className="font-semibold text-slate-700 py-4">
                                                    {new Date(m.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </td>
                                                <td className="font-mono text-slate-400 text-xs">
                                                    {new Date(m.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td>
                                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 shadow-sm inline-block">
                                                        +{m.quantity}
                                                    </span>
                                                </td>
                                                <td>
                                                    {m.purchaseDetails ? (
                                                        <div className="flex flex-col items-start gap-1">
                                                            <div className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border shadow-sm ${
                                                                m.purchaseDetails.paymentStatus === 'paid' 
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                                    : m.purchaseDetails.paymentStatus === 'partial' 
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                                            }`}>
                                                                {m.purchaseDetails.paymentStatus}
                                                            </div>
                                                            {m.purchaseDetails.paymentStatus === 'partial' && (
                                                                <div className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                                    Remain: ₹{((m.purchaseDetails.totalAmount || 0) - (m.purchaseDetails.amountPaid || 0)).toLocaleString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 italic">-</span>
                                                    )}
                                                </td>
                                                <td className="text-sm text-slate-500 max-w-md print:hidden leading-relaxed">
                                                    {m.notes || 'Auto adjustment via Stock Interface'}
                                                </td>
                                            </tr>
                                        ))}
                                        {historyData.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center py-16 text-base-content/50 print:col-span-4">
                                                    <Activity className="mx-auto mb-3 opacity-30" size={32}/>
                                                    No stock arrivals found for the selected time period.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop bg-black/60" onClick={() => setHistoryModalProduct(null)}><button>close</button></form>
            </dialog>
        </div>
    );
};

export default ManufacturerProfile;
