import { useState, useEffect } from 'react';
import API from '../api/axios';
import { Plus, Edit, Trash2, Search, Factory } from 'lucide-react';
import { Link } from 'react-router-dom';

const Manufacturers = () => {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', brandName: '', phoneNumber: '', factoryAddress: '', subBrands: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    try {
      const { data } = await API.get('/manufacturers');
      setManufacturers(data);
    } catch (error) {
      console.error('Error fetching manufacturers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (manufacturer = null) => {
    if (manufacturer) {
      setFormData({
        name: manufacturer.name,
        brandName: manufacturer.brandName || '',
        phoneNumber: manufacturer.phoneNumber || '',
        factoryAddress: manufacturer.factoryAddress || '',
        subBrands: manufacturer.subBrands && manufacturer.subBrands.length > 0 ? manufacturer.subBrands.join(', ') : ''
      });
      setEditingId(manufacturer._id);
    } else {
      setFormData({ name: '', brandName: '', phoneNumber: '', factoryAddress: '', subBrands: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, subBrands: formData.subBrands ? formData.subBrands.split(',').map(s => s.trim()).filter(Boolean) : [] };
    
    try {
      if (editingId) {
        await API.put(`/manufacturers/${editingId}`, payload);
      } else {
        await API.post('/manufacturers', payload);
      }
      setIsModalOpen(false);
      fetchManufacturers();
    } catch (error) {
      console.error('Error saving manufacturer', error);
      alert('Failed to save manufacturer');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this manufacturer?')) {
      try {
        await API.delete(`/manufacturers/${id}`);
        fetchManufacturers();
      } catch (error) {
        console.error('Error deleting manufacturer', error);
        alert('Failed to delete manufacturer');
      }
    }
  };

  const filtered = manufacturers.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    (m.brandName && m.brandName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
            <Factory className="text-primary" /> Manufacturers
        </h1>
        <button onClick={() => handleOpenModal()} className="btn btn-primary shadow-lg shadow-primary/30">
          <Plus size={20} /> Add Manufacturer
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
                    placeholder="Search by name or brand..." 
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
                <th className="font-bold py-4">Name</th>
                <th className="font-bold text-base-content/70">Brand</th>
                <th className="font-bold text-base-content/70">Phone Number</th>
                <th className="font-bold text-base-content/70 hidden md:table-cell">Address</th>
                <th className="text-right font-bold py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m._id} className="hover">
                  <td className="font-bold">
                    <Link to={`/manufacturers/${m._id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                        <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-8">
                                <span>{m.name.charAt(0)}</span>
                            </div>
                        </div>
                        {m.name}
                    </Link>
                  </td>
                  <td>{m.brandName || <span className="text-base-100/50">-</span>}</td>
                  <td>{m.phoneNumber || <span className="text-base-100/50">-</span>}</td>
                  <td className="max-w-xs truncate hidden md:table-cell" title={m.factoryAddress}>{m.factoryAddress || '-'}</td>
                  <td className="text-right">
                    <div className="join">
                      <button onClick={() => handleOpenModal(m)} className="btn btn-sm btn-ghost join-item text-info hover:bg-info hover:text-white transition-colors" title="Edit"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(m._id)} className="btn btn-sm btn-ghost join-item text-error hover:bg-error hover:text-white transition-colors" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                  <tr>
                      <td colSpan="5" className="text-center py-10 text-base-content/60 flex flex-col items-center">
                          <Factory size={48} className="mb-4 opacity-20" />
                          <p>No manufacturers found matching your search.</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box w-11/12 max-w-2xl bg-base-100 shadow-2xl">
          <h3 className="font-extrabold text-2xl mb-6 text-primary flex items-center gap-2">
            <Factory /> {editingId ? 'Edit Manufacturer' : 'New Manufacturer'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Name *</span></label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="input input-bordered w-full focus:input-primary" placeholder="e.g. Godrej Locks" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Primary Brand Name</span></label>
                <input value={formData.brandName} onChange={e => setFormData({...formData, brandName: e.target.value})} type="text" className="input input-bordered w-full focus:input-primary" placeholder="e.g. Godrej" />
              </div>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Phone Number</span></label>
              <input value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} type="text" className="input input-bordered w-full focus:input-primary" placeholder="+91 1234567890" />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Factory/Office Address</span></label>
              <textarea value={formData.factoryAddress} onChange={e => setFormData({...formData, factoryAddress: e.target.value})} className="textarea textarea-bordered h-24 focus:textarea-primary" placeholder="Full address..." />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Sub Brands</span></label>
              <input value={formData.subBrands} onChange={e => setFormData({...formData, subBrands: e.target.value})} type="text" className="input input-bordered w-full focus:input-primary" placeholder="Comma separated (e.g. NavTal, Ultra)" />
              <label className="label"><span className="label-text-alt text-base-content/60">Separate multiple brands with a comma.</span></label>
            </div>
            
            <div className="modal-action mt-8 border-t border-base-200 pt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancel</button>
              <button type="submit" className="btn btn-primary min-w-[120px]">
                {editingId ? 'Save Changes' : 'Create Manufacturer'}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-black/40" onClick={() => setIsModalOpen(false)}><button>close</button></form>
      </dialog>
    </div>
  );
};

export default Manufacturers;
