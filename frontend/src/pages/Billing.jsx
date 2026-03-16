import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api/axios';
import { Plus, Trash2, FileText, Printer, Check } from 'lucide-react';

const Billing = () => {
  const location = useLocation();
  const duplicateData = location.state?.duplicateData;

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Invoice State
  const [selectedCustomer, setSelectedCustomer] = useState(duplicateData?.customer || '');
  const [items, setItems] = useState(duplicateData?.items || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [companyDetails, setCompanyDetails] = useState({ companyName: 'Padlock System Solutions' });

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

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

  const fetchData = async () => {
    try {
      const [custRes, prodRes, stockRes] = await Promise.all([
          API.get('/customers'),
          API.get('/products'),
          API.get('/stocks')
      ]);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
      setStocks(stockRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { product: '', size: '', quantity: 1, unitType: 'dozen', pricePerUnit: 0 }]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto-fill price and size when product changes
    if (field === 'product') {
        const prodId = value;
        const prod = products.find(p => p._id === prodId);
        if (prod) {
            newItems[index].size = prod.size || '';
            
            // Check for customer custom price
            const customer = customers.find(c => c._id === selectedCustomer);
            if (customer && customer.customPrices && customer.customPrices[prodId]) {
                newItems[index].pricePerUnit = customer.customPrices[prodId];
            } else {
                newItems[index].pricePerUnit = prod.manufacturerPrice || 0;
            }
        }
    }
    
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + (item.quantity * item.pricePerUnit), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
        alert('Please select a customer.');
        return;
    }
    if (items.length === 0) {
        alert('Please add at least one item.');
        return;
    }

    // Validate quantities against stock
    for (const item of items) {
       const stock = stocks.find(s => s.product?._id === item.product && s.size === item.size && s.unitType === item.unitType);
       if (!stock || stock.quantity < item.quantity) {
           const p = products.find(p => p._id === item.product);
           alert(`Insufficient stock for ${p ? p.name : 'Unknown'} (${item.size}). Available: ${stock ? stock.quantity : 0}`);
           return;
       }
    }

    setIsSubmitting(true);
    try {
        const payload = {
            customer: selectedCustomer,
            items: items.map(i => ({
                product: i.product,
                size: i.size,
                quantity: Number(i.quantity),
                unitType: i.unitType,
                pricePerUnit: Number(i.pricePerUnit)
            }))
        };
        await API.post('/orders', payload);
        
        setSuccessMsg('Invoice generated successfully!');
        setItems([]);
        setSelectedCustomer('');
        fetchData(); // refresh stocks
        setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error) {
        console.error('Error creating invoice', error);
        alert(error.response?.data?.message || 'Failed to generate invoice');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
      window.print();
  };

  if (loading) {
      return <div className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  const subtotal = calculateSubtotal();

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4 print:hidden">
        <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="text-primary" /> Generate Invoice
        </h1>
        <button onClick={handlePrint} className="btn btn-outline">
          <Printer size={20} /> Print Layout
        </button>
      </div>

      {successMsg && (
          <div className="alert alert-success mb-6 print:hidden">
              <Check size={20} />
              <span>{successMsg}</span>
          </div>
      )}

      <div className="card bg-base-100 shadow-xl border border-base-200">
        <form onSubmit={handleSubmit} className="card-body p-8">
            
            {/* Invoice Header */}
            <div className="flex flex-col md:flex-row justify-between border-b border-base-200 pb-8 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-primary tracking-tight">INVOICE</h2>
                    <p className="text-base-content/60 mt-1">{companyDetails.companyName}</p>
                </div>
                <div className="form-control w-full md:w-72 mt-4 md:mt-0 print:hidden">
                    <label className="label"><span className="label-text font-bold">Billed To *</span></label>
                    <select 
                        required 
                        value={selectedCustomer} 
                        onChange={(e) => setSelectedCustomer(e.target.value)} 
                        className="select select-bordered w-full border-2 focus:border-primary"
                    >
                        <option value="">Select Customer...</option>
                        {customers.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                {/* Print only visible customer details */}
                <div className="hidden print:block text-right">
                    <h3 className="font-bold text-lg">Billed To:</h3>
                    {selectedCustomer ? (
                        <div>
                            <p className="font-bold">{customers.find(c => c._id === selectedCustomer)?.name}</p>
                            <p>{customers.find(c => c._id === selectedCustomer)?.address}</p>
                            <p>{customers.find(c => c._id === selectedCustomer)?.phoneNumber}</p>
                        </div>
                    ) : <p>No customer selected</p>}
                </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto mb-6">
                <table className="table w-full">
                    <thead>
                        <tr className="bg-base-200 text-base-content text-sm">
                            <th className="w-1/3">Item Description</th>
                            <th>Size</th>
                            <th>Unit Type</th>
                            <th className="text-right">Price/Unit (₹)</th>
                            <th className="text-right">Qty</th>
                            <th className="text-right">Amount (₹)</th>
                            <th className="w-10 print:hidden"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && (
                            <tr className="print:hidden">
                                <td colSpan="7" className="text-center py-10 text-base-content/50 bg-base-200/50 border-dashed border-2 border-base-300">
                                    Click "Add Item" to start building the invoice.
                                </td>
                            </tr>
                        )}
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    <select 
                                        required 
                                        value={item.product} 
                                        onChange={(e) => handleItemChange(index, 'product', e.target.value)} 
                                        className="select select-sm select-bordered w-full print:appearance-none print:border-none print:bg-transparent"
                                    >
                                        <option value="">Select Product...</option>
                                        {products.map(p => (
                                            <option key={p._id} value={p._id}>{p.name} ({p.productId})</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        value={item.size} 
                                        onChange={(e) => handleItemChange(index, 'size', e.target.value)} 
                                        className="input input-sm input-bordered w-full print:border-none print:bg-transparent" 
                                    />
                                </td>
                                <td>
                                    <select 
                                        value={item.unitType} 
                                        onChange={(e) => handleItemChange(index, 'unitType', e.target.value)} 
                                        className="select select-sm select-bordered w-full print:appearance-none print:border-none print:bg-transparent"
                                    >
                                        <option value="dozen">Dozen</option>
                                        <option value="pc">Piece</option>
                                    </select>
                                </td>
                                <td>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        required 
                                        value={item.pricePerUnit} 
                                        onChange={(e) => handleItemChange(index, 'pricePerUnit', e.target.value)} 
                                        className="input input-sm input-bordered w-full text-right print:border-none print:bg-transparent" 
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        required 
                                        value={item.quantity} 
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                                        className="input input-sm input-bordered w-full text-right print:border-none print:bg-transparent" 
                                    />
                                </td>
                                <td className="text-right font-bold align-middle">
                                    {(item.quantity * item.pricePerUnit).toFixed(2)}
                                </td>
                                <td className="print:hidden align-middle">
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="btn btn-sm btn-ghost text-error">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-start pt-4 border-t border-base-200 print:border-t-2 print:border-black">
                <button type="button" onClick={handleAddItem} className="btn btn-sm btn-outline btn-primary print:hidden">
                    <Plus size={16} /> Add Item
                </button>
                
                <div className="w-full md:w-64">
                    <div className="flex justify-between py-2 text-lg">
                        <span className="font-semibold text-base-content/70">Subtotal:</span>
                        <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-3 text-2xl border-t-2 border-base-300 mt-2">
                        <span className="font-black">Total:</span>
                        <span className="font-black text-primary">₹{subtotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="card-actions justify-end mt-10 border-t border-base-200 pt-6 print:hidden">
                <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg min-w-[200px] shadow-xl shadow-primary/30">
                    {isSubmitting ? <span className="loading loading-spinner"></span> : 'Complete Invoice'}
                </button>
            </div>
        </form>
      </div>
      
      {/* Print Footer */}
      <div className="hidden print:block mt-20 text-center text-sm text-gray-500">
          <p>Thank you for your business!</p>
          <div className="mt-10 flex justify-between px-10">
              <div className="border-t border-gray-400 pt-2 w-48">Customer Signature</div>
              <div className="border-t border-gray-400 pt-2 w-48">Authorized Signatory</div>
          </div>
      </div>
    </div>
  );
};

export default Billing;
