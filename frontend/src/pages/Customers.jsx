import { useState, useEffect } from 'react';
import API from '../api/axios';
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', address: '', signatureOrStamp: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await API.get('/customers');
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setFormData({
        name: customer.name,
        phoneNumber: customer.phoneNumber || '',
        address: customer.address || '',
        signatureOrStamp: customer.signatureOrStamp || ''
      });
      setEditingId(customer._id);
    } else {
      setFormData({ name: '', phoneNumber: '', address: '', signatureOrStamp: '' });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/customers/${editingId}`, formData);
      } else {
        await API.post('/customers', formData);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer', error);
      alert('Failed to save customer');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await API.delete(`/customers/${id}`);
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer', error);
        alert('Failed to delete customer');
      }
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phoneNumber && c.phoneNumber.includes(search))
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="text-primary" /> Customers
        </h1>
        <button onClick={() => handleOpenModal()} className="btn btn-primary shadow-lg shadow-primary/30">
          <Plus size={20} /> Add Customer
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
                    placeholder="Search by name or phone..." 
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
                <th className="font-bold py-4">Customer Name</th>
                <th className="font-bold text-base-content/70">Phone Number</th>
                <th className="font-bold text-base-content/70 hidden md:table-cell">Address</th>
                <th className="font-bold text-base-content/70">Custom Prices</th>
                <th className="text-right font-bold py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id} className="hover">
                  <td className="font-bold">
                    <Link to={`/customers/${c._id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                        <div className="avatar placeholder">
                            <div className="bg-secondary text-secondary-content rounded-full w-8">
                                <span>{c.name.charAt(0)}</span>
                            </div>
                        </div>
                        {c.name}
                    </Link>
                  </td>
                  <td>{c.phoneNumber || <span className="text-base-100/50">-</span>}</td>
                  <td className="max-w-xs truncate hidden md:table-cell" title={c.address}>{c.address || '-'}</td>
                  <td>
                    {c.customPrices && Object.keys(c.customPrices).length > 0 ? (
                        <div className="badge badge-accent badge-sm">{Object.keys(c.customPrices).length} rules</div>
                    ) : (
                        <span className="text-base-content/50 text-xs">Standard</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="join">
                      <button onClick={() => handleOpenModal(c)} className="btn btn-sm btn-ghost join-item text-info hover:bg-info hover:text-white transition-colors" title="Edit"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(c._id)} className="btn btn-sm btn-ghost join-item text-error hover:bg-error hover:text-white transition-colors" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                  <tr>
                      <td colSpan="5" className="text-center py-10 text-base-content/60 flex flex-col items-center">
                          <Users size={48} className="mb-4 opacity-20" />
                          <p>No customers found matching your search.</p>
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
            <Users /> {editingId ? 'Edit Customer' : 'New Customer'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Customer Name *</span></label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="input input-bordered w-full focus:input-primary" placeholder="e.g. Rahul Gupta" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Phone Number</span></label>
                <input value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} type="text" className="input input-bordered w-full focus:input-primary" placeholder="+91 9876543210" />
              </div>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Address</span></label>
              <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="textarea textarea-bordered h-24 focus:textarea-primary" placeholder="Full address..." />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Signature / Stamp Logo URL</span></label>
              <input value={formData.signatureOrStamp} onChange={e => setFormData({...formData, signatureOrStamp: e.target.value})} type="text" className="input input-bordered w-full focus:input-primary" placeholder="https://..." />
            </div>
            
            <div className="modal-action mt-8 border-t border-base-200 pt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancel</button>
              <button type="submit" className="btn btn-primary min-w-[120px]">
                {editingId ? 'Save Changes' : 'Create Customer'}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-black/40" onClick={() => setIsModalOpen(false)}><button>close</button></form>
      </dialog>
    </div>
  );
};

export default Customers;
