import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { ArrowLeft, Check, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const PurchaseDetail = () => {
    const { id } = useParams();
    const [purchase, setPurchase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [companyDetails, setCompanyDetails] = useState({ companyName: 'Padlock System Solutions' });

    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Purchase_${purchase?.purchaseId || 'N_A'}`,
    });

    useEffect(() => {
        fetchPurchase();
        fetchSettings();
    }, [id]);

    const fetchSettings = async () => {
        try {
            const { data } = await API.get('/settings');
            if (data?.companyName) {
                setCompanyDetails(data);
            }
        } catch (error) {
            console.error('Error fetching settings', error);
        }
    };

    const fetchPurchase = async () => {
        try {
            const { data } = await API.get(`/purchases/${id}`);
            setPurchase(data);
        } catch (error) {
            console.error('Error fetching purchase detail', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async () => {
        setStatusUpdating(true);
        try {
            await API.put(`/purchases/${id}/payment`, { paymentStatus: 'paid' });
            fetchPurchase();
        } catch (error) {
            console.error('Error updating status', error);
            alert('Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    if (loading) return <div className="text-center py-20"><span className="loading loading-spinner text-primary"></span></div>;
    if (!purchase) return <div className="text-center py-20 text-error">Purchase not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/purchases" className="btn btn-ghost btn-circle">
                        <ArrowLeft />
                    </Link>
                    <h1 className="text-3xl font-bold">
                        Purchase <span className="text-primary">{purchase.purchaseId || 'N/A'}</span>
                    </h1>
                </div>
                <div className="flex flex-wrap gap-2">
                    {purchase.paymentStatus !== 'paid' && (
                        <button onClick={handleMarkPaid} disabled={statusUpdating} className="btn btn-success text-white">
                            {statusUpdating ? <span className="loading loading-spinner loading-sm"></span> : <><Check size={18} /> Mark as Paid</>}
                        </button>
                    )}
                    <button onClick={handlePrint} className="btn btn-primary shadow-md shadow-primary/30">
                        <Download size={18} /> Download / Print PDF
                    </button>
                </div>
            </div>

            {/* Printable Invoice Component */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" ref={componentRef}>
                <div className="p-10 md:p-14">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-slate-100 pb-8 mb-8 gap-6">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight uppercase">Purchase Invoice</h2>
                            <p className="text-slate-500 mt-1 font-medium">{companyDetails.companyName}</p>
                        </div>
                        <div className="text-left md:text-right text-slate-600">
                            <p><span className="font-semibold text-slate-800 mr-2">Purchase ID:</span> {purchase.purchaseId || 'N/A'}</p>
                            <p><span className="font-semibold text-slate-800 mr-2">Date:</span> {new Date(purchase.date).toLocaleDateString()}</p>
                            <p className="mt-3">
                                <span className={`px-3 py-1 text-xs font-black tracking-widest uppercase rounded-full ${purchase.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : purchase.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                    {purchase.paymentStatus || 'pending'}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="mb-10">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Purchased From</h3>
                        <p className="text-2xl font-bold text-slate-800">{purchase.manufacturer?.name || 'Unknown Manufacturer'}</p>
                        <p className="text-slate-500 mt-1 max-w-sm leading-relaxed">{purchase.manufacturer?.contactInfo || 'No Contact Info Provided'}</p>
                    </div>

                    {/* Line Items */}
                    <div className="mb-8">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b-2 border-slate-200 text-slate-500 text-xs uppercase tracking-wider pb-2">
                                    <th className="py-3 pr-4 font-bold">Item Description</th>
                                    <th className="py-3 px-4 font-bold">Size & Unit</th>
                                    <th className="py-3 pl-4 text-right font-bold w-24">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchase.products?.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/50">
                                        <td className="py-4 pr-4">
                                            <p className="font-bold text-slate-800">{item.product?.name || 'Unknown Product'}</p>
                                        </td>
                                        <td className="py-4 px-4 text-slate-600">
                                            {item.size || item.product?.size || 'N/A'} <span className="text-slate-400 capitalize">({item.unitType || item.product?.unitType || 'piece'})</span>
                                        </td>
                                        <td className="py-4 pl-4 text-right text-slate-800 font-medium">{item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mt-8">
                        <div className="w-full md:w-80">
                            {purchase.paymentStatus === 'partial' && (
                                <>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                        <span className="text-slate-500 font-medium">Original Inv Total</span>
                                        <span className="font-bold text-slate-800">₹{purchase.totalAmount?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-slate-500 font-medium">Paid Amount</span>
                                            <span className="text-xs text-slate-400 mt-0.5">On {new Date(purchase.updatedAt || purchase.date).toLocaleDateString()}</span>
                                        </div>
                                        <span className="font-bold text-emerald-600">₹{(purchase.amountPaid || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4 mt-2 bg-slate-50 rounded-lg px-4 border border-slate-200">
                                        <span className="font-black text-slate-800 uppercase text-sm tracking-wider">Total Remaining</span>
                                        <span className="font-black text-rose-600 text-xl">₹{((purchase.totalAmount || 0) - (purchase.amountPaid || 0)).toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                            
                            {purchase.paymentStatus !== 'partial' && (
                                <div className="flex justify-between items-center py-5 mt-4 border-t-2 border-slate-200">
                                    <span className="font-black text-slate-800 uppercase text-sm tracking-widest">Total</span>
                                    <span className="font-black text-primary text-2xl">₹{purchase.totalAmount?.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Print Footer */}
                <div className="bg-slate-50 p-8 border-t border-slate-200 text-center text-sm text-slate-400">
                    <p className="font-semibold text-slate-500 tracking-wide">THANK YOU FOR YOUR BUSINESS</p>
                    <div className="mt-20 flex justify-between px-4 md:px-12">
                        <div className="border-t-2 border-slate-300 pt-3 w-40 font-bold text-slate-600 uppercase tracking-wider text-xs">Receiver Signature</div>
                        <div className="border-t-2 border-slate-300 pt-3 w-48 font-bold text-slate-600 uppercase tracking-wider text-xs">Authorized Signatory</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseDetail;
