import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import API from '../api/axios';
import { LogOut, Users, Plus, ShieldAlert, Edit, Save, X, LayoutDashboard, Settings as SettingsIcon, CreditCard, Search, Filter, Trash2, DollarSign, TrendingUp } from 'lucide-react';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [analytics, setAnalytics] = useState({ totalEarnings: 0, thisMonthEarnings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters for Customers
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Form states - Clients
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [activeClientProfile, setActiveClientProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  
  const [profileEditForm, setProfileEditForm] = useState({ name: '', email: '', phone: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [resetPassword, setResetPassword] = useState('');

  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', password: '', subscriptionPlan: '', customExpiryDate: '' });
  const [editingClient, setEditingClient] = useState(null);
  const [editClientForm, setEditClientForm] = useState({ subscriptionPlan: '', customExpiryDate: '', status: '', customStorageLimitMB: '' });

  // Form states - Plans
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ name: '', price: 0, durationInMonths: 1, storageLimitMB: 500, features: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [clientsRes, plansRes, analyticsRes] = await Promise.all([
        API.get('/superadmin/clients'),
        API.get('/superadmin/plans'),
        API.get('/superadmin/analytics')
      ]);
      setClients(clientsRes.data);
      setPlans(plansRes.data);
      setAnalytics(analyticsRes.data);
      
      if (plansRes.data.length > 0) {
          setNewClient(prev => ({ ...prev, subscriptionPlan: plansRes.data[0]._id }));
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // --- CLIENT LOGIC ---
  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      await API.post('/superadmin/clients', newClient);
      setShowAddClientModal(false);
      setNewClient({ name: '', email: '', phone: '', password: '', subscriptionPlan: plans.length > 0 ? plans[0]._id : '', customExpiryDate: '' });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add client');
    }
  };

  const openClientProfile = async (clientId) => {
    try {
      setIsProfileLoading(true);
      setActiveTab('clientProfile');
      const { data } = await API.get(`/superadmin/clients/${clientId}/profile`);
      setActiveClientProfile(data);
      setProfileEditForm({ name: data.client.name, email: data.client.email, phone: data.client.phone || '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load profile');
      setActiveTab('clients');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleUpdateProfileDetails = async (e) => {
    e.preventDefault();
    try {
       await API.put(`/superadmin/clients/${activeClientProfile.client._id}/details`, profileEditForm);
       setIsEditingProfile(false);
       openClientProfile(activeClientProfile.client._id);
       fetchDashboardData();
    } catch (error) {
       alert(error.response?.data?.message || 'Failed to update details');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword || resetPassword.length < 6) return alert("Password must be at least 6 characters");
    try {
       await API.put(`/superadmin/clients/${activeClientProfile.client._id}/password`, { password: resetPassword });
       setResetPassword('');
       alert("Password reset successfully!");
    } catch (error) {
       alert(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const openEditClientModal = (client) => {
    setEditingClient(client._id);
    setEditClientForm({ 
      subscriptionPlan: client.subscriptionPlan?._id || client.subscriptionPlan || '', 
      status: client.status,
      customExpiryDate: client.subscriptionExpiresAt ? new Date(client.subscriptionExpiresAt).toISOString().split('T')[0] : '',
      customStorageLimitMB: client.customStorageLimitMB !== undefined && client.customStorageLimitMB !== null ? client.customStorageLimitMB : ''
    });
    setShowEditClientModal(true);
  };

  const handleSaveEditClient = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/superadmin/clients/${editingClient}`, editClientForm);
      setShowEditClientModal(false);
      
      // If we are currently viewing this client's profile, refresh it
      if (activeTab === 'clientProfile' && activeClientProfile?.client?._id === editingClient) {
          openClientProfile(editingClient);
      } else {
          setEditingClient(null);
          fetchDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update client');
    }
  };

  // --- PLAN LOGIC ---
  const openPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan._id);
      setPlanForm({
        name: plan.name,
        price: plan.price,
        durationInMonths: plan.durationInMonths,
        storageLimitMB: plan.storageLimitMB,
        features: plan.features.join(', ')
      });
    } else {
      setEditingPlan(null);
      setPlanForm({ name: '', price: 0, durationInMonths: 1, storageLimitMB: 500, features: '' });
    }
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...planForm, features: planForm.features.split(',').map(f => f.trim()).filter(f => f) };
      if (editingPlan) {
        await API.put(`/superadmin/plans/${editingPlan}`, payload);
      } else {
        await API.post('/superadmin/plans', payload);
      }
      setShowPlanModal(false);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await API.delete(`/superadmin/plans/${planId}`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  // --- FILTER CLIENTS ---
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    
    let planId = c.subscriptionPlan?._id || c.subscriptionPlan;
    // Map default legacy string to empty string logic or keep as is
    const matchesPlan = planFilter === 'all' || planId === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const activeClients = clients.filter(c => c.status === 'active').length;

  const renderTabContent = () => {
    if (activeTab === 'clientProfile') {
      return (
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
             <div className="flex items-center gap-4">
                <button onClick={() => setActiveTab('clients')} className="btn btn-ghost btn-sm btn-circle"><X size={20}/></button>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users size={24} className="text-primary" /> Customer Profile Insight
                </h2>
             </div>
           </div>

           {isProfileLoading ? (
               <div className="flex justify-center p-12"><span className="loading loading-spinner text-primary loading-lg"></span></div>
           ) : activeClientProfile ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 {/* Left Column: Details & Password */}
                 <div className="space-y-6">
                    <div className="card bg-base-100 shadow-xl border border-base-200">
                       <div className="card-body">
                          <div className="flex justify-between items-center mb-4">
                             <h3 className="card-title text-xl border-b border-base-200 pb-2 flex-1">Company Information</h3>
                             {!isEditingProfile && (
                               <button onClick={() => setIsEditingProfile(true)} className="btn btn-sm btn-ghost text-primary"><Edit size={16}/> Edit</button>
                             )}
                          </div>
                          
                          {isEditingProfile ? (
                             <form onSubmit={handleUpdateProfileDetails} className="space-y-4">
                                <div className="form-control">
                                  <label className="label"><span className="label-text font-bold">Business Name</span></label>
                                  <input required type="text" className="input input-bordered focus:input-primary" value={profileEditForm.name} onChange={e => setProfileEditForm({...profileEditForm, name: e.target.value})} />
                                </div>
                                <div className="form-control">
                                  <label className="label"><span className="label-text font-bold">Email Address</span></label>
                                  <input required type="email" className="input input-bordered focus:input-primary" value={profileEditForm.email} onChange={e => setProfileEditForm({...profileEditForm, email: e.target.value})} />
                                </div>
                                <div className="form-control">
                                  <label className="label"><span className="label-text font-bold">Phone Number</span></label>
                                  <input type="text" className="input input-bordered focus:input-primary" value={profileEditForm.phone} onChange={e => setProfileEditForm({...profileEditForm, phone: e.target.value})} />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                   <button type="button" onClick={() => setIsEditingProfile(false)} className="btn btn-sm btn-ghost">Cancel</button>
                                   <button type="submit" className="btn btn-sm btn-primary">Save Details</button>
                                </div>
                             </form>
                          ) : (
                             <div className="space-y-3">
                                {activeClientProfile.setting?.companyName ? (
                                    <>
                                        <h4 className="text-2xl font-bold text-primary">{activeClientProfile.setting.companyName}</h4>
                                        <p className="flex items-center gap-3"><span className="opacity-70 w-28 font-medium">Account Owner:</span> <strong className="text-lg">{activeClientProfile.client.name}</strong></p>
                                    </>
                                ) : (
                                    <h4 className="text-2xl font-bold text-primary">{activeClientProfile.client.name}</h4>
                                )}
                                <p className="flex items-center gap-3"><span className="opacity-70 w-28 font-medium">Email:</span> <strong className="text-lg">{activeClientProfile.setting?.companyEmail || activeClientProfile.client.email}</strong></p>
                                <p className="flex items-center gap-3"><span className="opacity-70 w-28 font-medium">Phone:</span> <strong className="text-lg">{activeClientProfile.setting?.companyPhone || activeClientProfile.client.phone || 'N/A'}</strong></p>
                                {activeClientProfile.setting && (!activeClientProfile.client.phone) && (
                                   <div className="alert alert-info py-2 rounded-lg mt-2 text-sm border-info/50 shadow-sm">
                                      <span>Found phone number in internal inventory settings! Click "Edit" to auto-sync.</span>
                                   </div>
                                )}
                             </div>
                          )}
                       </div>
                    </div>

                    <div className="card bg-base-100 shadow-xl border border-base-200">
                       <div className="card-body">
                          <h3 className="card-title text-xl border-b border-base-200 pb-2 mb-4 text-error">Security Overrides</h3>
                          <form onSubmit={handleResetPassword} className="space-y-4">
                             <div className="form-control">
                               <label className="label"><span className="label-text font-bold">Force Reset Password</span></label>
                               <div className="flex gap-2">
                                 <input minLength="6" type="text" placeholder="New Password..." className="input input-bordered w-full focus:input-error font-mono text-sm" value={resetPassword} onChange={e => setResetPassword(e.target.value)} />
                                 <button type="submit" disabled={!resetPassword} className="btn btn-error text-white">Reset Default</button>
                               </div>
                               <label className="label"><span className="label-text-alt opacity-60">This bypasses the old password logic entirely, forcing a new raw password.</span></label>
                             </div>
                          </form>
                       </div>
                    </div>
                 </div>

                 {/* Right Column: Plan & Storage */}
                 <div className="space-y-6">
                    <div className="card bg-base-100 shadow-xl border border-base-200">
                       <div className="card-body">
                          <div className="flex justify-between items-center mb-4">
                             <h3 className="card-title text-xl border-b border-base-200 pb-2 flex-1">Plan Configuration</h3>
                             <button onClick={() => openEditClientModal(activeClientProfile.client)} className="btn btn-sm btn-ghost text-primary"><Edit size={16}/> Modify Assigned Plan</button>
                          </div>
                          <div className="flex items-center gap-4 mb-3">
                             <span className="opacity-70 w-28 font-medium">Assigned Plan:</span> 
                             {activeClientProfile.client.subscriptionPlan && typeof activeClientProfile.client.subscriptionPlan === 'string' ? (
                                <span className="badge badge-primary badge-lg font-bold capitalize">{activeClientProfile.client.subscriptionPlan}</span>
                             ) : activeClientProfile.client.subscriptionPlan?.name ? (
                                <span className="badge badge-primary badge-lg font-bold">{activeClientProfile.client.subscriptionPlan.name}</span>
                             ) : (
                                <span className="badge badge-error badge-lg font-bold">No Plan Assigned</span>
                             )}
                          </div>
                          <div className="flex items-center gap-4 mb-3">
                             <span className="opacity-70 w-28 font-medium">Billing Expires On:</span> 
                             <strong className="text-lg">{new Date(activeClientProfile.client.subscriptionExpiresAt).toLocaleDateString()}</strong>
                          </div>
                          {!activeClientProfile.client.subscriptionPlan?.name && (
                             <div className="alert alert-warning py-2 rounded-lg mt-4 text-sm font-medium border-warning/50">
                                <ShieldAlert size={16}/> This legacy client has no active limits. Edit their plan from the main customers table to establish a billing cycle.
                             </div>
                          )}
                       </div>
                    </div>

                    <div className="card bg-base-100 shadow-xl border border-base-200">
                       <div className="card-body">
                          <h3 className="card-title text-xl border-b border-base-200 pb-2 mb-4">Database Resource Utilization</h3>
                           {(() => {
                              const plan = activeClientProfile.client.subscriptionPlan;
                              const isLegacy = typeof plan === 'string';
                              const rawLimit = (plan && plan.storageLimitMB) || 0;
                              const limit = activeClientProfile.client.customStorageLimitMB !== null && activeClientProfile.client.customStorageLimitMB !== undefined ? activeClientProfile.client.customStorageLimitMB : rawLimit;
                              const hasCustomLimit = activeClientProfile.client.customStorageLimitMB !== null && activeClientProfile.client.customStorageLimitMB !== undefined;
                              const used = activeClientProfile.storageUsedMB || 0;
                              const percentage = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
                              const isNearingLimit = percentage > 85;

                              return (
                                 <div className="pt-2">
                                   <div className="flex justify-between items-end mb-3">
                                      <span className="font-bold text-2xl">{used.toFixed(2)} MB <span className="opacity-60 text-lg font-normal">/ {limit || 'Unlimited'} MB {hasCustomLimit && <span className="text-secondary text-sm font-bold">(Custom Override)</span>}</span></span>
                                      {limit > 0 && <span className={`text-xl font-black ${isNearingLimit ? 'text-error' : 'text-success'}`}>{percentage.toFixed(1)}%</span>}
                                   </div>
                                   {limit > 0 ? (
                                      <>
                                          <progress className={`progress w-full h-4 ${isNearingLimit ? 'progress-error' : 'progress-primary'}`} value={percentage} max="100"></progress>
                                          {isNearingLimit && <p className="text-error text-sm mt-3 font-bold flex items-center gap-2 bg-error/10 p-3 rounded-lg"><ShieldAlert size={18}/> DB Quota Warning: Reaching maximum capacity!</p>}
                                      </>
                                   ) : (
                                      <p className="text-sm opacity-70 italic font-medium">This active plan does not enforce a database storage quota limit.</p>
                                   )}
                                 </div>
                              );
                          })()}
                       </div>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="alert alert-error font-medium shadow-sm">Failed to load profile payload.</div>
           )}
        </div>
      );
    }

    if (activeTab === 'dashboard') {
      return (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold flex items-center gap-3 text-base-content">
            <LayoutDashboard size={28} className="text-primary" /> Dashboard Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <div className="stat bg-base-100 shadow-xl rounded-2xl border border-base-200">
              <div className="stat-figure text-primary">
                <Users size={36} />
              </div>
              <div className="stat-title font-medium">Total Agency Clients</div>
              <div className="stat-value text-primary">{clients.length}</div>
            </div>
            <div className="stat bg-base-100 shadow-xl rounded-2xl border border-base-200">
              <div className="stat-figure text-success">
                <ShieldAlert size={36} />
              </div>
              <div className="stat-title font-medium">Active Subscriptions</div>
              <div className="stat-value text-success">{activeClients}</div>
            </div>
            <div className="stat bg-gradient-to-br from-primary/10 to-primary/5 shadow-xl rounded-2xl border border-primary/20">
              <div className="stat-figure text-primary">
                <DollarSign size={36} />
              </div>
              <div className="stat-title font-medium text-primary/70">Total Earnings</div>
              <div className="stat-value text-primary">₹{analytics.totalEarnings.toLocaleString()}</div>
            </div>
            <div className="stat bg-gradient-to-br from-secondary/10 to-secondary/5 shadow-xl rounded-2xl border border-secondary/20">
              <div className="stat-figure text-secondary">
                <TrendingUp size={36} />
              </div>
              <div className="stat-title font-medium text-secondary/70">Earnings This Month</div>
              <div className="stat-value text-secondary">₹{analytics.thisMonthEarnings.toLocaleString()}</div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl mt-6 border border-base-200">
             <div className="card-body">
                <h3 className="card-title text-xl">Welcome back, Super Admin!</h3>
                <p className="text-base-content/70">From the sidebar on the left, you can manage your agency clients, create pricing tiers, and track revenue seamlessly.</p>
             </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'plans') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <CreditCard size={24} className="text-primary" /> Subscription Plans
                    </h2>
                    <button onClick={() => openPlanModal()} className="btn btn-primary shadow-lg shadow-primary/30">
                        <Plus size={18} /> New Plan
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div key={plan._id} className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary/50 transition-colors">
                            <div className="card-body">
                                <h2 className="card-title text-2xl">{plan.name}</h2>
                                <p className="text-3xl font-bold text-primary my-2">₹{plan.price} <span className="text-sm text-base-content/50 font-normal">/ {plan.durationInMonths} mo</span></p>
                                <div className="badge badge-secondary mb-2">Limit: {plan.storageLimitMB} MB</div>
                                <ul className="mt-4 space-y-2 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex flex-start gap-2 text-sm opacity-80">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <div className="card-actions justify-end mt-6 pt-4 border-t border-base-200">
                                    <button onClick={() => openPlanModal(plan)} className="btn btn-sm btn-ghost text-primary"><Edit size={16}/> Edit</button>
                                    <button onClick={() => handleDeletePlan(plan._id)} className="btn btn-sm btn-ghost text-error"><Trash2 size={16}/> Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {plans.length === 0 && (
                        <div className="col-span-full text-center py-12 text-base-content/50 font-medium">No subscription plans created yet.</div>
                    )}
                </div>
            </div>
        )
    }

    if (activeTab === 'settings') {
      return (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold flex items-center gap-3 text-base-content">
            <SettingsIcon size={28} className="text-primary" /> Global Settings
          </h2>
          <div className="card bg-base-100 shadow-xl border border-base-200 max-w-3xl">
            <div className="card-body">
              <h3 className="card-title mb-4 border-b border-base-200 pb-2">Account Details</h3>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text font-medium">Super Admin Email Address</span></label>
                <input type="text" className="input input-bordered focus:input-primary" value={user?.email || ''} readOnly />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text font-medium">Platform Version</span></label>
                <input type="text" className="input input-bordered" value="SaaS Padlock Inventory v2.1.0" readOnly />
              </div>
              <div className="alert alert-info py-3 mt-4 rounded-xl">
                <span>Currently, super admin credentials and advanced configurations are managed through server-side environment configurations. In future releases, this panel will map to automated deployment settings.</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default to 'clients' tab content
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users size={24} className="text-primary" /> Manage Agency Clients
          </h2>
          <button onClick={() => setShowAddClientModal(true)} className="btn btn-primary shadow-lg shadow-primary/30">
            <Plus size={18} /> New Client
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-base-100 p-4 rounded-2xl shadow-sm border border-base-200">
            <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-3 text-base-content/40" />
                <input 
                    type="text" 
                    placeholder="Search by name or email..." 
                    className="input input-bordered w-full pl-10"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="join w-full">
                    <select className="select select-bordered join-item w-full md:w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="hold">Hold</option>
                    </select>
                </div>
                <div className="join w-full">
                    <select className="select select-bordered join-item w-full md:w-auto" value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
                        <option value="all">All Plans</option>
                        {plans.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>
                    <div className="btn btn-square join-item pointer-events-none bg-base-200 border-base-300">
                        <Filter size={18} className="opacity-50" />
                    </div>
                </div>
            </div>
        </div>

        {error && <div className="alert alert-error mb-4 rounded-xl">{error}</div>}

        <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-base-200 text-base-content">
                  <th className="font-semibold text-sm">Name / Email</th>
                  <th className="font-semibold text-sm">Subscription Plan</th>
                  <th className="font-semibold text-sm">Expires At</th>
                  <th className="font-semibold text-sm">Status</th>
                  <th className="font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="5" className="text-center py-12"><span className="loading loading-spinner loading-lg text-primary"></span></td></tr>
                ) : filteredClients.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-12 text-base-content/50 font-medium">No clients found matching criteria</td></tr>
                ) : filteredClients.map(client => (
                  <tr key={client._id} className="hover">
                    <td>
                      <div className="font-bold text-base cursor-pointer hover:text-primary transition-colors inline-block" onClick={() => openClientProfile(client._id)}>
                        {client.name}
                      </div>
                      <div className="text-sm opacity-60 font-medium mt-1">{client.email}</div>
                    </td>
                    <td>
                      <span className="badge badge-lg badge-ghost capitalize font-medium">{client.subscriptionPlan?.name || client.subscriptionPlan || 'N/A'}</span>
                    </td>
                    <td className="font-medium text-sm">
                      <span className={`${new Date(client.subscriptionExpiresAt) < new Date() ? 'text-error font-bold flex items-center gap-2' : ''}`}>
                         {new Date(client.subscriptionExpiresAt).toLocaleDateString()}
                         {new Date(client.subscriptionExpiresAt) < new Date() && <span className="badge badge-error badge-sm">Expired</span>}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-lg border-none text-white ${client.status === 'active' ? 'bg-success' : 'bg-error'}`}>
                        {client.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => openEditClientModal(client)} className="btn btn-sm btn-ghost btn-square text-primary hover:bg-primary/10">
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-base-200 overflow-hidden font-sans">
      {/* Sidebar Layout */}
      <aside className="w-72 bg-base-100 shadow-2xl flex flex-col h-full z-20 border-r border-base-200 transition-all">
        <div className="p-8 border-b border-base-200">
          <div className="flex items-center gap-3 text-primary font-black text-2xl tracking-tight">
             <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                 <ShieldAlert size={28} className="text-primary" />
             </div>
             <span className="text-lg md:text-xl lg:text-2xl truncate">
  SaaS Admin
</span>
          </div>
        </div>
        
        <div className="flex-1 py-8 px-5 space-y-3 overflow-y-auto">
          <div className="text-xs font-bold text-base-content/40 uppercase tracking-widest px-3 mb-2">Menu</div>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-4 w-full px-5 py-4 rounded-xl transition-all font-semibold text-left ${activeTab === 'dashboard' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'}`}
          >
            <LayoutDashboard size={22} className={activeTab === 'dashboard' ? 'text-white' : 'text-base-content/60'} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-4 w-full px-5 py-4 rounded-xl transition-all font-semibold text-left ${activeTab === 'clients' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'}`}
          >
            <Users size={22} className={activeTab === 'clients' ? 'text-white' : 'text-base-content/60'} /> Customers
          </button>
          <button 
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-4 w-full px-5 py-4 rounded-xl transition-all font-semibold text-left ${activeTab === 'plans' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'}`}
          >
            <CreditCard size={22} className={activeTab === 'plans' ? 'text-white' : 'text-base-content/60'} /> Plans & Pricing
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-4 w-full px-5 py-4 rounded-xl transition-all font-semibold text-left ${activeTab === 'settings' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'}`}
          >
            <SettingsIcon size={22} className={activeTab === 'settings' ? 'text-white' : 'text-base-content/60'} /> Settings
          </button>
        </div>
        
        <div className="p-6 border-t border-base-200 bg-base-100/50">
          <div className="flex items-center gap-4 px-2 mb-6">
             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-inner">
               {user?.email?.[0].toUpperCase()}
             </div>
             <div className="overflow-hidden flex-1">
                <div className="font-bold text-sm text-base-content truncate">Super Admin</div>
                <div className="text-xs font-medium opacity-60 truncate">{user?.email}</div>
             </div>
          </div>
          <button onClick={logout} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-error/50 hover:bg-error/10 hover:border-error text-error transition-all font-bold text-sm">
            <LogOut size={18} /> Logout Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full relative bg-base-200/50 p-8 md:p-12">
        <div className="max-w-7xl mx-auto w-full pb-20">
          {renderTabContent()}
        </div>
      </main>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl p-8 max-w-md">
            <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                 <Plus size={24} />
              </div>
              New Customer (Admin)
            </h3>
            <form onSubmit={handleAddClient}>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text font-bold">Business Name</span></label>
                <input required type="text" placeholder="e.g. Acme Locks" className="input input-bordered focus:input-primary transition-colors" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text font-bold">Phone Number</span></label>
                <input required type="text" placeholder="e.g. +91 9876543210" className="input input-bordered focus:input-primary transition-colors" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text font-bold">Email Address</span></label>
                <input required type="email" placeholder="admin@business.com" className="input input-bordered focus:input-primary transition-colors" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text font-bold">Login Password</span></label>
                <input required type="password" placeholder="••••••••" className="input input-bordered focus:input-primary transition-colors" value={newClient.password} onChange={e => setNewClient({...newClient, password: e.target.value})} />
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text font-bold">Subscription Plan Bundle</span></label>
                <select className="select select-bordered focus:select-primary" value={newClient.subscriptionPlan} onChange={e => setNewClient({...newClient, subscriptionPlan: e.target.value})}>
                  {plans.map(p => (
                      <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>
                  ))}
                  {plans.length === 0 && <option value="" disabled>No plans available. Create a plan first.</option>}
                </select>
              </div>
              <div className="modal-action mt-8 flex justify-end gap-3 border-t border-base-200 pt-6">
                <button type="button" className="btn btn-ghost rounded-xl px-6" onClick={() => setShowAddClientModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary rounded-xl px-8 shadow-lg shadow-primary/30" disabled={plans.length === 0}>Create Account</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-base-200/80 backdrop-blur-sm" onClick={() => setShowAddClientModal(false)}></div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditClientModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl p-8 max-w-md">
            <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                 <Edit size={24} />
              </div>
              Edit Customer Status & Plan
            </h3>
            <form onSubmit={handleSaveEditClient}>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text font-bold">Update Subscription Plan</span></label>
                <select className="select select-bordered focus:select-primary" value={editClientForm.subscriptionPlan} onChange={e => setEditClientForm({...editClientForm, subscriptionPlan: e.target.value})}>
                  {plans.map(p => (
                      <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>
                  ))}
                  <option value="custom">Assign Custom Plan Option</option>
                  {plans.length === 0 && <option value="" disabled>No plans available.</option>}
                </select>
                <label className="label"><span className="label-text-alt opacity-60">Updating the plan immediately applies billing duration math upon save. It will overwrite the old duration.</span></label>
              </div>

              {editClientForm.subscriptionPlan === 'custom' && (
                  <div className="form-control mb-4">
                      <label className="label"><span className="label-text font-bold">Custom Expiry Date</span></label>
                      <input type="date" className="input input-bordered focus:input-primary" value={editClientForm.customExpiryDate} onChange={e => setEditClientForm({...editClientForm, customExpiryDate: e.target.value})} />
                  </div>
              )}

              <div className="form-control mb-4">
                 <label className="label"><span className="label-text font-bold">Storage/MB Quota Override</span></label>
                 <input type="number" min="0" placeholder="Optional numeric MB limit limit..." className="input input-bordered focus:input-primary" value={editClientForm.customStorageLimitMB} onChange={e => setEditClientForm({...editClientForm, customStorageLimitMB: e.target.value})} />
                 <label className="label"><span className="label-text-alt opacity-60">Leave entirely blank to inherit default plan limits. Enter numbers here to override.</span></label>
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text font-bold">Account Access Status</span></label>
                <select className="select select-bordered focus:select-primary" value={editClientForm.status} onChange={e => setEditClientForm({...editClientForm, status: e.target.value})}>
                  <option value="active">Active (Full Access)</option>
                  <option value="hold">Hold (Access Revoked)</option>
                </select>
              </div>
              <div className="modal-action mt-8 flex justify-end gap-3 border-t border-base-200 pt-6">
                <button type="button" className="btn btn-ghost rounded-xl px-6" onClick={() => setShowEditClientModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary rounded-xl px-8 shadow-lg shadow-primary/30">Save Changes</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-base-200/80 backdrop-blur-sm" onClick={() => setShowEditClientModal(false)}></div>
        </div>
      )}

      {/* Plan Modal (Add/Edit) */}
      {showPlanModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl p-8 max-w-md">
            <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                 <CreditCard size={24} />
              </div>
              {editingPlan ? 'Edit Plan' : 'Create Pricing Plan'}
            </h3>
            <form onSubmit={handleSavePlan}>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text font-bold">Plan Title</span></label>
                <input required type="text" placeholder="e.g. Premium Edge" className="input input-bordered focus:input-primary transition-colors" value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                  <div className="form-control mb-4">
                    <label className="label"><span className="label-text font-bold">Price (₹)</span></label>
                    <input required min="0" type="number" className="input input-bordered focus:input-primary transition-colors" value={planForm.price} onChange={e => setPlanForm({...planForm, price: e.target.value})} />
                  </div>
                  <div className="form-control mb-4">
                    <label className="label"><span className="label-text font-bold">Duration (mo)</span></label>
                    <input required min="1" type="number" className="input input-bordered focus:input-primary transition-colors" value={planForm.durationInMonths} onChange={e => setPlanForm({...planForm, durationInMonths: e.target.value})} />
                  </div>
                  <div className="form-control mb-4">
                    <label className="label"><span className="label-text font-bold">Storage (MB)</span></label>
                    <input required min="1" type="number" className="input input-bordered focus:input-primary transition-colors" value={planForm.storageLimitMB} onChange={e => setPlanForm({...planForm, storageLimitMB: e.target.value})} />
                  </div>
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text font-bold">Features (comma separated)</span></label>
                <textarea required placeholder="Unlimited users, Advanced reporting, PDF Export..." className="textarea textarea-bordered focus:textarea-primary transition-colors h-24" value={planForm.features} onChange={e => setPlanForm({...planForm, features: e.target.value})}></textarea>
              </div>
              <div className="modal-action mt-8 flex justify-end gap-3 border-t border-base-200 pt-6">
                <button type="button" className="btn btn-ghost rounded-xl px-6" onClick={() => setShowPlanModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary rounded-xl px-8 shadow-lg shadow-primary/30">{editingPlan ? 'Save Changes' : 'Create Plan'}</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-base-200/80 backdrop-blur-sm" onClick={() => setShowPlanModal(false)}></div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
