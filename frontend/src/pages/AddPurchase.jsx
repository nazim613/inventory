import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { ShoppingCart, Plus, Trash2, ArrowLeft } from 'lucide-react';

const AddPurchase = () => {
  const navigate = useNavigate();
  const [manufacturers, setManufacturers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    manufacturer: '',
    date: new Date().toISOString().split('T')[0],
    purchaseId: 'PUR-' + Date.now().toString().slice(-6),
    notes: ''
  });

  const [items, setItems] = useState([
    { product: '', quantity: 1, manufacturerPrice: 0, size: '', unitType: 'dozen' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mRes, pRes] = await Promise.all([
        API.get('/manufacturers'),
        API.get('/products')
      ]);
      setManufacturers(mRes.data);
      setProducts(pRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  const handleProductChange = (index, productId) => {
    const product = products.find(p => p._id === productId);
    const newItems = [...items];
    newItems[index].product = productId;
    if (product) {
      newItems[index].manufacturerPrice = product.manufacturerPrice || 0;
      newItems[index].size = product.size || '';
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { product: '', quantity: 1, manufacturerPrice: 0, size: '', unitType: 'dozen' }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.manufacturerPrice), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.manufacturer) return alert('Select a manufacturer');
    if (items.some(i => !i.product || i.quantity <= 0)) return alert('Fill all product details correctly');

    setLoading(true);
    try {
      const payload = {
        ...formData,
        products: items,
        totalAmount,
        paymentStatus: 'pending'
      };
      
      await API.post('/purchases', payload);
      navigate('/purchases');
    } catch (error) {
      console.error('Error creating purchase', error);
      alert('Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/purchases')} className="btn btn-ghost btn-circle">
            <ArrowLeft />
        </button>
        <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="text-primary" /> New Purchase
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
                <h2 className="card-title text-base border-b pb-2 mb-4">Basic Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="form-control">
                        <label className="label"><span className="label-text font-semibold">Manufacturer *</span></label>
                        <select 
                            required 
                            className="select select-bordered focus:select-primary"
                            value={formData.manufacturer}
                            onChange={e => setFormData({...formData, manufacturer: e.target.value})}
                        >
                            <option value="" disabled>Select Manufacturer</option>
                            {manufacturers.map(m => (
                                <option key={m._id} value={m._id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text font-semibold">Date *</span></label>
                        <input 
                            required 
                            type="date" 
                            className="input input-bordered focus:input-primary"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text font-semibold">Purchase ID *</span></label>
                        <input 
                            required 
                            type="text" 
                            className="input input-bordered focus:input-primary"
                            value={formData.purchaseId}
                            onChange={e => setFormData({...formData, purchaseId: e.target.value})}
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h2 className="card-title text-base">Products</h2>
                    <button type="button" onClick={addItem} className="btn btn-sm btn-outline btn-primary">
                        <Plus size={16} /> Add Item
                    </button>
                </div>
                
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-base-200/50 p-4 rounded-xl border border-base-200">
                            <div className="form-control flex-1 min-w-[200px]">
                                <label className="label"><span className="label-text text-xs">Product</span></label>
                                <select 
                                    required 
                                    className="select select-bordered select-sm w-full"
                                    value={item.product}
                                    onChange={(e) => handleProductChange(index, e.target.value)}
                                >
                                    <option value="" disabled>Select Product</option>
                                    {products.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} {p.size ? `(${p.size})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-control w-24">
                                <label className="label"><span className="label-text text-xs">Unit Type</span></label>
                                <select className="select select-bordered select-sm" value={item.unitType} onChange={e => {
                                    const newItems = [...items];
                                    newItems[index].unitType = e.target.value;
                                    setItems(newItems);
                                }}>
                                    <option value="dozen">Dozen</option>
                                    <option value="pc">Pc</option>
                                </select>
                            </div>
                            <div className="form-control w-24">
                                <label className="label"><span className="label-text text-xs">Qty</span></label>
                                <input type="number" min="1" required className="input input-bordered input-sm" value={item.quantity} onChange={e => {
                                    const newItems = [...items];
                                    newItems[index].quantity = parseInt(e.target.value);
                                    setItems(newItems);
                                }}/>
                            </div>
                            <div className="form-control w-32">
                                <label className="label"><span className="label-text text-xs">Price/Unit (₹)</span></label>
                                <input type="number" min="0" required className="input input-bordered input-sm" value={item.manufacturerPrice} onChange={e => {
                                    const newItems = [...items];
                                    newItems[index].manufacturerPrice = parseFloat(e.target.value);
                                    setItems(newItems);
                                }}/>
                            </div>
                            <div className="form-control w-32">
                                <label className="label"><span className="label-text text-xs">Total</span></label>
                                <div className="font-mono font-bold text-lg h-8 flex items-center px-2 bg-base-100 rounded border border-base-300">
                                    ₹{(item.quantity * item.manufacturerPrice) || 0}
                                </div>
                            </div>
                            <button type="button" onClick={() => removeItem(index)} className="btn btn-sm btn-ghost text-error mb-[2px]" disabled={items.length === 1}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <div className="bg-primary/10 px-6 py-4 rounded-xl border border-primary/20 text-right">
                        <div className="text-base-content/60 text-sm font-semibold mb-1">Total Amount</div>
                        <div className="text-3xl font-bold font-mono text-primary">₹{totalAmount.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </div>

        <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body">
                <div className="form-control">
                    <label className="label"><span className="label-text font-semibold">Notes / Remarks</span></label>
                    <textarea 
                        className="textarea textarea-bordered focus:textarea-primary h-20" 
                        placeholder="Any additional details..."
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                    ></textarea>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 pb-10">
            <button type="button" onClick={() => navigate('/purchases')} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary px-8 shadow-lg shadow-primary/30 text-lg">
                {loading ? <span className="loading loading-spinner"></span> : 'Save Purchase'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default AddPurchase;
