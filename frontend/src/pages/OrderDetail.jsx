import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { ArrowLeft, Printer, Check, Copy, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [duplicating, setDuplicating] = useState(false);
    const [companyDetails, setCompanyDetails] = useState({ companyName: 'Padlock System Solutions' });

    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Invoice_${order?.invoiceNumber || 'N_A'}`,
    });

    useEffect(() => {
        fetchOrder();
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

    const fetchOrder = async () => {
        try {
            const { data } = await API.get(`/orders/${id}`);
            setOrder({ ...data.order, items: data.orderItems });
        } catch (error) {
            console.error('Error fetching order detail', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async () => {
        setStatusUpdating(true);
        try {
            await API.put(`/orders/${id}/payment`, { paymentStatus: 'paid' });
            fetchOrder();
        } catch (error) {
            console.error('Error updating status', error);
            alert('Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleDuplicate = async () => {
        if (!window.confirm('Navigate to Billing with these order items?')) return;
        setDuplicating(true);
        try {
            const { data } = await API.get(`/orders/${id}/duplicate`);
            navigate('/billing', { state: { duplicateData: data } });
        } catch (error) {
            console.error('Error preparing duplicate order', error.response?.data?.message || error.message);
            alert(error.response?.data?.message || 'Failed to prepopulate duplicate order.');
        } finally {
            setDuplicating(false);
        }
    };

    if (loading) return <div className="text-center py-20"><span className="loading loading-spinner text-primary"></span></div>;
    if (!order) return <div className="text-center py-20 text-error">Invoice not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/orders" className="btn btn-ghost btn-circle">
                        <ArrowLeft />
                    </Link>
                    <h1 className="text-3xl font-bold">
                        Invoice <span className="text-primary">{order.invoiceNumber || 'N/A'}</span>
                    </h1>
                </div>
                <div className="flex flex-wrap gap-2">
                    {order.paymentStatus !== 'paid' && (
                        <button onClick={handleMarkPaid} disabled={statusUpdating} className="btn btn-success text-white">
                            {statusUpdating ? <span className="loading loading-spinner loading-sm"></span> : <><Check size={18} /> Mark as Paid</>}
                        </button>
                    )}
                    <button onClick={handleDuplicate} disabled={duplicating} className="btn btn-outline btn-secondary">
                        {duplicating ? <span className="loading loading-spinner loading-sm"></span> : <><Copy size={18} /> Duplicate</>}
                    </button>
                    <button onClick={handlePrint} className="btn btn-primary shadow-md shadow-primary/30">
                        <Download size={18} /> Download / Print PDF
                    </button>
                </div>
            </div>

            {/* Printable Invoice Component */}
            <div className="card bg-white text-black shadow-xl border border-gray-200" ref={componentRef}>
                <div className="card-body p-10 md:p-14">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
                        <div>
                            <h2 className="text-4xl font-black text-gray-800 tracking-tight">INVOICE</h2>
                            <p className="text-gray-500 mt-1 font-medium">{companyDetails.companyName}</p>
                        </div>
                        <div className="text-right text-gray-600">
                            <p><span className="font-semibold text-gray-800">Invoice No:</span> {order.invoiceNumber || 'N/A'}</p>
                            <p><span className="font-semibold text-gray-800">Date:</span> {new Date(order.date).toLocaleDateString()}</p>
                            <p className="mt-2">
                                <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {order.paymentStatus || 'unpaid'}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="flex justify-between mb-10">
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
                            <p className="text-xl font-bold text-gray-800">{order.customer?.name}</p>
                            <p className="text-gray-600 max-w-xs">{order.customer?.address || 'No Address Provided'}</p>
                            <p className="text-gray-600 font-medium mt-1">{order.customer?.phoneNumber || 'No Phone'}</p>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                    <th className="p-4 border-b border-gray-200">Item Description</th>
                                    <th className="p-4 border-b border-gray-200">Size & Unit</th>
                                    <th className="p-4 border-b border-gray-200 text-right">Qty</th>
                                    <th className="p-4 border-b border-gray-200 text-right">Price/Unit</th>
                                    <th className="p-4 border-b border-gray-200 text-right font-bold text-gray-800">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-100 last:border-b-0">
                                        <td className="p-4">
                                            <p className="font-bold text-gray-800">{item.product?.name || 'Unknown Product'}</p>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {item.size || 'N/A'} <span className="text-gray-400 capitalize">({item.unitType})</span>
                                        </td>
                                        <td className="p-4 text-right text-gray-800 font-medium">{item.quantity}</td>
                                        <td className="p-4 text-right text-gray-600">₹{item.pricePerUnit?.toFixed(2)}</td>
                                        <td className="p-4 text-right font-bold text-gray-800">
                                            ₹{(item.quantity * item.pricePerUnit).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mt-8">
                        <div className="w-64 bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <div className={`flex justify-between py-2 ${order.paymentStatus === 'partial' ? 'border-b border-gray-200 mb-2' : ''}`}>
                                <span className="text-gray-500 font-medium">Subtotal</span>
                                <span className="font-bold text-gray-800">₹{order.totalAmount?.toLocaleString()}</span>
                            </div>
                            
                            {order.paymentStatus === 'partial' && (
                                <>
                                    <div className="flex justify-between py-2 border-b border-gray-200 mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-gray-500 font-medium">Paid Amount</span>
                                            <span className="text-xs text-gray-400">On {new Date(order.updatedAt || order.date).toLocaleDateString()}</span>
                                        </div>
                                        <span className="font-bold text-success flex items-center">₹{(order.amountPaid || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-2 text-xl border-t border-gray-200 mt-2 pt-4">
                                        <span className="font-black text-gray-800">Total Remaining Amount</span>
                                        <span className="font-black text-error">₹{((order.totalAmount || 0) - (order.amountPaid || 0)).toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                            
                            {order.paymentStatus !== 'partial' && (
                                <div className="flex justify-between py-2 text-xl border-t border-gray-200 mt-2 pt-4">
                                    <span className="font-black text-gray-800">Total</span>
                                    <span className="font-black text-primary">₹{order.totalAmount?.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Print Footer */}
                <div className="bg-gray-50 p-8 border-t border-gray-100 text-center text-sm text-gray-500">
                    <p className="font-medium text-gray-700">Thank you for your business!</p>
                    <div className="mt-16 flex justify-between px-10">
                        <div className="border-t-2 border-gray-300 pt-2 w-48 font-bold text-gray-800">Customer Signature</div>
                        <div className="border-t-2 border-gray-300 pt-2 w-48 font-bold text-gray-800">Authorized Signatory</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
