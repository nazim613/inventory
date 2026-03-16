import { useState, useEffect } from 'react';
import API from '../api/axios';
import { Plus, Edit, Trash2, Search, Package, Filter, History } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMfg, setFilterMfg] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
      name: '', productId: '', manufacturer: '', brand: '', size: '', unitType: 'dozen', manufacturerPrice: 0, image: '' 
  });
  const [editingId, setEditingId] = useState(null);
  
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState(null);
  const [movementHistory, setMovementHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async (product) => {
    setSelectedProductForHistory(product);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
        const { data } = await API.get(`/inventory?productId=${product._id}`);
        setMovementHistory(data);
    } catch (error) {
        console.error('Error fetching inventory history', error);
    } finally {
        setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, mfgRes] = await Promise.all([
          API.get('/products'),
          API.get('/manufacturers')
      ]);
      setProducts(prodRes.data);
      setManufacturers(mfgRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setFormData({
        name: product.name,
        productId: product.productId || '',
        manufacturer: product.manufacturer ? product.manufacturer._id : '',
        brand: product.brand || '',
        size: product.size || '',
        unitType: product.unitType || 'dozen',
        manufacturerPrice: product.manufacturerPrice || 0,
        image: product.image || ''
      });
      setEditingId(product._id);
    } else {
      setFormData({ name: '', productId: '', manufacturer: '', brand: '', size: '', unitType: 'dozen', manufacturerPrice: 0, image: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/products/${editingId}`, formData);
      } else {
        await API.post('/products', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving product', error);
      alert(error.response?.data?.message || 'Failed to save product. Ensure Product ID is unique.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await API.delete(`/products/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting product', error);
        alert('Failed to delete product');
      }
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.productId.toLowerCase().includes(search.toLowerCase());
    const matchesMfg = filterMfg ? p.manufacturer?._id === filterMfg : true;
    return matchesSearch && matchesMfg;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="text-primary" /> Products
        </h1>
        <button onClick={() => handleOpenModal()} className="btn btn-primary shadow-lg shadow-primary/30">
          <Plus size={20} /> Add Product
        </button>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200 mb-6 w-full">
        <div className="card-body p-4 flex flex-col md:flex-row gap-4">
            <div className="join flex-1">
                <div className="flex items-center bg-base-200 px-3 rounded-l-lg border border-base-300 border-r-0">
                    <Search size={18} className="text-base-content/50" />
                </div>
                <input 
                    className="input input-bordered join-item w-full focus:input-primary" 
                    placeholder="Search by name or product ID..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="join md:w-72">
                <div className="flex items-center bg-base-200 px-3 rounded-l-lg border border-base-300 border-r-0">
                    <Filter size={18} className="text-base-content/50" />
                </div>
                <select 
                    className="select select-bordered join-item w-full focus:select-primary"
                    value={filterMfg}
                    onChange={(e) => setFilterMfg(e.target.value)}
                >
                    <option value="">All Manufacturers</option>
                    {manufacturers.map(m => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                </select>
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
                <th className="font-bold py-4">Product Info</th>
                <th className="font-bold text-base-content/70">Unique ID</th>
                <th className="font-bold text-base-content/70">Manufacturer</th>
                <th className="font-bold text-base-content/70">Size & Unit</th>
                <th className="font-bold text-base-content/70">Mfg Price</th>
                <th className="text-right font-bold py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id} className="hover">
                  <td className="font-bold">
                    <div className="flex items-center gap-3">
                        <div className="avatar">
                            <div className="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center p-1">
                                {p.image ? <img src={p.image} alt={p.name} className="object-cover rounded-md" /> : <Package size={20} className="text-base-content/40" />}
                            </div>
                        </div>
                        <div>
                            <div>{p.name}</div>
                            <div className="text-xs font-normal text-base-content/60">{p.brand}</div>
                        </div>
                    </div>
                  </td>
                  <td><span className="font-mono bg-base-200 px-2 py-1 rounded text-xs">{p.productId}</span></td>
                  <td>{p.manufacturer?.name || <span className="text-error text-xs">Unassigned</span>}</td>
                  <td>
                      <div className="flex gap-2 items-center">
                          {p.size ? <span className="badge badge-neutral">{p.size}</span> : <span>-</span>}
                          <span className="text-xs text-base-content/50 capitalize">{p.unitType}</span>
                      </div>
                  </td>
                  <td className="font-medium">₹{p.manufacturerPrice || 0}</td>
                  <td className="text-right">
                    <div className="join">
                      <button onClick={() => fetchHistory(p)} className="btn btn-sm btn-ghost join-item text-secondary hover:bg-secondary hover:text-white transition-colors" title="Stock History"><History size={16} /></button>
                      <button onClick={() => handleOpenModal(p)} className="btn btn-sm btn-ghost join-item text-info hover:bg-info hover:text-white transition-colors" title="Edit"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(p._id)} className="btn btn-sm btn-ghost join-item text-error hover:bg-error hover:text-white transition-colors" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                  <tr>
                      <td colSpan="6" className="text-center py-10 text-base-content/60 flex flex-col items-center">
                          <Package size={48} className="mb-4 opacity-20" />
                          <p>No products found matching your search.</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box w-11/12 max-w-3xl bg-base-100 shadow-2xl">
          <h3 className="font-extrabold text-2xl mb-6 text-primary flex items-center gap-2">
            <Package /> {editingId ? 'Edit Product' : 'New Product'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Product Name *</span></label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="input input-bordered w-full focus:input-primary" placeholder="e.g. NavTal 6 Levers" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Unique Product ID *</span></label>
                <input required value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} type="text" className="input input-bordered w-full focus:input-primary font-mono" placeholder="e.g. GDJ-NVT-6L-65" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Manufacturer</span></label>
                <select value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="select select-bordered w-full focus:select-primary">
                    <option value="">Select Manufacturer</option>
                    {manufacturers.map(m => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                </select>
                </div>
                <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Brand Variant</span></label>
                <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} type="text" className="input input-bordered w-full focus:input-primary" placeholder="e.g. NavTal" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Size (mm/inch)</span></label>
                <input value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} type="text" className="input input-bordered w-full focus:input-primary" placeholder="e.g. 65mm" list="sizes" />
                <datalist id="sizes">
                    <option value="25mm" />
                    <option value="30mm" />
                    <option value="40mm" />
                    <option value="50mm" />
                    <option value="65mm" />
                    <option value="75mm" />
                </datalist>
                </div>
                <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Unit Type</span></label>
                <select value={formData.unitType} onChange={e => setFormData({...formData, unitType: e.target.value})} className="select select-bordered w-full focus:select-primary">
                    <option value="dozen">dozen</option>
                    <option value="pc">pc</option>
                </select>
                </div>
                <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Manufacturer Price (₹)</span></label>
                <input value={formData.manufacturerPrice} onChange={e => setFormData({...formData, manufacturerPrice: Number(e.target.value)})} type="number" step="0.01" className="input input-bordered w-full focus:input-primary" />
                </div>
            </div>
            
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Image URL</span></label>
              <input value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} type="url" className="input input-bordered w-full focus:input-primary" placeholder="https://..." />
            </div>
            
            <div className="modal-action mt-8 border-t border-base-200 pt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancel</button>
              <button type="submit" className="btn btn-primary min-w-[120px]">
                {editingId ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-black/40" onClick={() => setIsModalOpen(false)}><button>close</button></form>
      </dialog>

      {/* History Modal */}
      <dialog className={`modal ${historyModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box w-11/12 max-w-2xl bg-base-100 shadow-2xl">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <History className="text-secondary" /> Stock History: {selectedProductForHistory?.name}
          </h3>
          <button onClick={() => setHistoryModalOpen(false)} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          
          {historyLoading ? (
             <div className="text-center py-10"><span className="loading loading-spinner text-secondary"></span></div>
          ) : (
            <div className="overflow-x-auto max-h-96">
                <table className="table table-sm w-full">
                    <thead className="sticky top-0 bg-base-100 z-10">
                        <tr className="bg-base-200">
                            <th>Date</th>
                            <th>Type</th>
                            <th>Quantity Change</th>
                            <th>Reference</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movementHistory.map(m => (
                            <tr key={m._id}>
                                <td>{new Date(m.date).toLocaleString()}</td>
                                <td>
                                    <span className={`badge badge-sm ${m.type === 'purchase' ? 'badge-success' : m.type === 'sale' ? 'badge-info' : 'badge-warning'}`}>
                                        {m.type}
                                    </span>
                                </td>
                                <td className="font-mono font-bold">
                                    <span className={m.quantity > 0 ? 'text-success' : 'text-error'}>
                                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                                    </span>
                                </td>
                                <td className="text-xs text-base-content/70">{m.referenceId || '-'}</td>
                            </tr>
                        ))}
                        {movementHistory.length === 0 && (
                            <tr><td colSpan="4" className="text-center py-6 text-base-content/50">No stock movements found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
          )}
        </div>
        <form method="dialog" className="modal-backdrop bg-black/40" onClick={() => setHistoryModalOpen(false)}><button>close</button></form>
      </dialog>
    </div>
  );
};

export default Products;
