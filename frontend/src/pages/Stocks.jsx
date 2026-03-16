import { useState, useEffect } from 'react';
import API from '../api/axios';
import { Plus, Edit, Trash2, Search, Container, AlertCircle } from 'lucide-react';

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
      product: '', size: '', quantity: 0, unitType: 'dozen' 
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stockRes, prodRes] = await Promise.all([
          API.get('/stocks'),
          API.get('/products')
      ]);
      setStocks(stockRes.data);
      setProducts(prodRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsUpdating(false);
    setFormData({ product: '', size: '', quantity: 0, unitType: 'dozen' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenUpdateModal = (stock) => {
    setIsUpdating(true);
    setFormData({ 
        product: stock.product._id, 
        size: stock.size || '', 
        quantity: stock.quantity, 
        unitType: stock.unitType 
    });
    setEditingId(stock._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isUpdating && editingId) {
        // Use the set action to update exact quantity
        await API.put(`/stocks/${editingId}`, { action: 'set', quantity: formData.quantity });
      } else {
        await API.post('/stocks', formData);
        
        const prod = products.find(p => p._id === formData.product);
        if (prod && prod.manufacturer) {
             alert(`Stock added successfully. An automatic Purchase Invoice has been generated for the Manufacturer for ₹${(Number(formData.quantity) * Number(prod.manufacturerPrice || 0)).toLocaleString()}.`);
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving stock', error);
      alert('Failed to save stock');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stock entry?')) {
      try {
        await API.delete(`/stocks/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting stock', error);
        alert('Failed to delete stock entry');
      }
    }
  };

  // When selecting a product, try to autofill its default size
  const handleProductSelection = (e) => {
      const prodId = e.target.value;
      const prod = products.find(p => p._id === prodId);
      setFormData({
          ...formData, 
          product: prodId,
          size: prod ? (prod.size || formData.size) : formData.size
      });
  };

  const filtered = stocks.filter(s => {
    const pName = s.product ? s.product.name.toLowerCase() : '';
    const pId = s.product ? s.product.productId.toLowerCase() : '';
    const query = search.toLowerCase();
    return pName.includes(query) || pId.includes(query);
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
            <Container className="text-primary" /> Stock Inventory
        </h1>
        <button onClick={handleOpenAddModal} className="btn btn-primary shadow-lg shadow-primary/30">
          <Plus size={20} /> Add Stock Allocation
        </button>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200 mb-6 w-full md:w-96">
        <div className="card-body p-4">
            <div className="join w-full">
                <div className="flex items-center bg-base-200 px-3 rounded-l-lg border border-base-300 border-r-0">
                    <Search size={18} className="text-base-content/50" />
                </div>
                <input 
                    className="input input-bordered join-item w-full focus:input-primary" 
                    placeholder="Search by product name or ID..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
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
                <th className="font-bold py-4">Product</th>
                <th className="font-bold text-base-content/70">Size</th>
                <th className="font-bold text-base-content/70">Quantity Available</th>
                <th className="font-bold text-base-content/70">Unit Type</th>
                <th className="text-right font-bold py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const isLow = s.quantity < 20;
                return (
                <tr key={s._id} className={`hover ${isLow ? 'bg-error/5' : ''}`}>
                  <td className="font-bold">
                      {s.product ? (
                          <div className="flex items-center gap-2">
                             {s.product.name}
                             <span className="badge badge-ghost badge-sm font-mono">{s.product.productId}</span>
                          </div>
                      ) : <span className="text-error">Unknown</span>}
                  </td>
                  <td>{s.size || '-'}</td>
                  <td>
                      <div className={`font-mono font-bold text-lg ${isLow ? 'text-error' : 'text-success'}`}>
                          {s.quantity}
                          {isLow && <AlertCircle size={14} className="inline ml-2" />}
                      </div>
                  </td>
                  <td><div className="badge badge-neutral">{s.unitType}</div></td>
                  <td className="text-right">
                    <div className="join">
                      <button onClick={() => handleOpenUpdateModal(s)} className="btn btn-sm btn-ghost join-item text-primary hover:bg-primary hover:text-white transition-colors" title="Adjust Stock">Adjust</button>
                      <button onClick={() => handleDelete(s._id)} className="btn btn-sm btn-ghost join-item text-error hover:bg-error hover:text-white transition-colors" title="Delete Entry"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )})}
              {filtered.length === 0 && (
                  <tr>
                      <td colSpan="5" className="text-center py-10 text-base-content/60 flex flex-col items-center">
                          <Container size={48} className="mb-4 opacity-20" />
                          <p>No stock entries found.</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box bg-base-100 shadow-2xl border-t-8 border-primary">
          <h3 className="font-extrabold text-2xl mb-6 text-primary flex items-center gap-2">
            <Container /> {isUpdating ? 'Adjust Stock Quantity' : 'Add New Stock Allocation'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Product *</span></label>
              <select 
                  required 
                  value={formData.product} 
                  onChange={handleProductSelection} 
                  className="select select-bordered w-full focus:select-primary"
                  disabled={isUpdating} // Cannot change product when updating existing stock
              >
                  <option value="">Select Product</option>
                  {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.productId})</option>
                  ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Size</span></label>
                <input 
                    value={formData.size} 
                    onChange={e => setFormData({...formData, size: e.target.value})} 
                    disabled={isUpdating} // Cannot change size when updating existing stock
                    type="text" 
                    className="input input-bordered w-full focus:input-primary" 
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Unit Type</span></label>
                <select 
                    value={formData.unitType} 
                    onChange={e => setFormData({...formData, unitType: e.target.value})} 
                    disabled={isUpdating}
                    className="select select-bordered w-full focus:select-primary"
                >
                    <option value="dozen">Dozen</option>
                    <option value="pc">Piece (pc)</option>
                </select>
              </div>
            </div>

            <div className="form-control mt-4">
              <label className="label">
                  <span className="label-text font-semibold">
                      {isUpdating ? 'New Total Quantity *' : 'Quantity *'}
                  </span>
              </label>
              <input 
                  required 
                  value={formData.quantity} 
                  onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} 
                  type="number" 
                  min="0"
                  className="input input-bordered w-full focus:input-primary font-mono text-lg" 
              />
            </div>

            {!isUpdating && formData.product && products.find(p => p._id === formData.product)?.manufacturer && (
                <div className="alert alert-info mt-6 bg-blue-50 text-blue-800 border-blue-200">
                    <AlertCircle size={20} />
                    <div>
                        <h3 className="font-bold text-sm">Automatic Purchase Generation</h3>
                        <div className="text-xs">
                            Adding this stock will automatically generate a new Purchase Invoice for the manufacturer and increase their payable balance by:
                            <br/><span className="font-bold text-sm mt-1 inline-block">₹{((products.find(p => p._id === formData.product)?.manufacturerPrice || 0) * (formData.quantity || 0)).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="modal-action mt-8 pt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost border-base-300">Cancel</button>
              <button type="submit" className="btn btn-primary min-w-[120px]">
                {isUpdating ? 'Save Changes' : 'Confirm Allocation'}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-black/40" onClick={() => setIsModalOpen(false)}><button>close</button></form>
      </dialog>
    </div>
  );
};

export default Stocks;
