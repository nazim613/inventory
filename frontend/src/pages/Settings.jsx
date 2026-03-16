import { useState, useEffect } from 'react';
import API from '../api/axios';
import { Settings as SettingsIcon, Save, ImageIcon, Key, Building2, Palette } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  
  // User/Auth State
  const [userData, setUserData] = useState(null);

  // Profile State
  const [formData, setFormData] = useState({ 
      companyName: '',
      companyEmail: '',
      companyPhone: '',
      invoiceFooterText: '' 
  });

  // Security State
  const [passwords, setPasswords] = useState({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
  });

  // Preferences State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [{ data: settingsData }, { data: authData }] = await Promise.all([
          API.get('/settings').catch(() => ({ data: {} })),
          API.get('/auth/me').catch(() => ({ data: null }))
      ]);

      if (authData) {
          setUserData(authData);
      }

      if (settingsData) {
          setFormData({
              companyName: settingsData.companyName || '',
              companyEmail: settingsData.companyEmail || '',
              companyPhone: settingsData.companyPhone || '',
              invoiceFooterText: settingsData.invoiceFooterText || ''
          });
      }
    } catch (error) {
      console.error('Error fetching settings/profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await API.put('/settings', formData);
      setSuccessMsg('Company profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Error saving settings', error);
      setErrorMsg('Failed to save company profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
      e.preventDefault();
      if (passwords.newPassword !== passwords.confirmPassword) {
          setErrorMsg('New passwords do not match!');
          return;
      }
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');
      try {
          await API.put('/auth/change-password', {
              oldPassword: passwords.oldPassword,
              newPassword: passwords.newPassword
          });
          setSuccessMsg('Password updated successfully!');
          setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
          setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
          console.error('Error changing password', error);
          setErrorMsg(error.response?.data?.message || 'Failed to change password.');
      } finally {
          setSaving(false);
      }
  };

  const handleThemeChange = (newTheme) => {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (loading) {
      return <div className="text-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <SettingsIcon size={28} />
        </div>
        <h1 className="text-3xl font-extrabold text-base-content tracking-tight">System Settings</h1>
      </div>

      {successMsg && (
          <div className="alert alert-success shadow-lg mb-6 rounded-xl">
              <span className="font-semibold">{successMsg}</span>
          </div>
      )}
      
      {errorMsg && (
          <div className="alert alert-error shadow-lg mb-6 rounded-xl text-white">
              <span className="font-semibold">{errorMsg}</span>
          </div>
      )}

      {/* Tabs Menu */}
      <div className="tabs tabs-boxed bg-base-100 p-1.5 shadow-sm border border-base-200 inline-flex mb-6 rounded-xl flex-wrap">
          <button 
              className={`tab tab-lg rounded-lg gap-2 ${activeTab === 'profile' ? 'tab-active bg-primary text-primary-content font-bold shadow' : 'text-base-content/70 font-medium hover:text-base-content'}`}
              onClick={() => { setActiveTab('profile'); setErrorMsg(''); setSuccessMsg(''); }}
          >
              <Building2 size={18} /> Company Profile
          </button>
          
          {/* Only Admins (Customers) have subscriptions, SuperAdmins probably don't need this tab */}
          {userData?.role === 'admin' && (
              <button 
                  className={`tab tab-lg rounded-lg gap-2 ${activeTab === 'subscription' ? 'tab-active bg-primary text-primary-content font-bold shadow' : 'text-base-content/70 font-medium hover:text-base-content'}`}
                  onClick={() => { setActiveTab('subscription'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                  <Key size={18} /> Subscription Plan
              </button>
          )}

          <button 
              className={`tab tab-lg rounded-lg gap-2 ${activeTab === 'security' ? 'tab-active bg-primary text-primary-content font-bold shadow' : 'text-base-content/70 font-medium hover:text-base-content'}`}
              onClick={() => { setActiveTab('security'); setErrorMsg(''); setSuccessMsg(''); }}
          >
              <Key size={18} /> Security
          </button>
          <button 
              className={`tab tab-lg rounded-lg gap-2 ${activeTab === 'preferences' ? 'tab-active bg-primary text-primary-content font-bold shadow' : 'text-base-content/70 font-medium hover:text-base-content'}`}
              onClick={() => { setActiveTab('preferences'); setErrorMsg(''); setSuccessMsg(''); }}
          >
              <Palette size={18} /> Preferences
          </button>
      </div>

      <div className="card bg-base-100 shadow-xl border border-base-200 rounded-2xl overflow-hidden">
        <div className="card-body p-8 md:p-10">
            
            {/* COMPANY PROFILE TAB */}
            {activeTab === 'profile' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-8 border-b border-base-200 pb-4">
                        <h2 className="text-2xl font-bold text-base-content">Company Profile</h2>
                        <p className="text-base-content/60 mt-1">Manage your company's public identity and invoice details.</p>
                    </div>
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-control md:col-span-2">
                                <label className="label"><span className="label-text font-bold text-base-content/80 text-sm tracking-wide uppercase">Company Name</span></label>
                                <input 
                                    type="text" 
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                    className="input input-bordered w-full focus:input-primary font-medium bg-base-50" 
                                    placeholder="Padlock Industry Ltd."
                                />
                            </div>
                            
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold text-base-content/80 text-sm tracking-wide uppercase">Email Address</span></label>
                                <input 
                                    type="email" 
                                    value={formData.companyEmail}
                                    onChange={(e) => setFormData({...formData, companyEmail: e.target.value})}
                                    className="input input-bordered w-full focus:input-primary font-medium bg-base-50" 
                                    placeholder="contact@company.com"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold text-base-content/80 text-sm tracking-wide uppercase">Phone Number</span></label>
                                <input 
                                    type="text" 
                                    value={formData.companyPhone}
                                    onChange={(e) => setFormData({...formData, companyPhone: e.target.value})}
                                    className="input input-bordered w-full focus:input-primary font-medium bg-base-50" 
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>

                        <div className="form-control pt-6">
                            <label className="label"><span className="label-text font-bold text-base-content/80 text-sm tracking-wide uppercase">Invoice Footer Text</span></label>
                            <textarea 
                                value={formData.invoiceFooterText}
                                onChange={(e) => setFormData({...formData, invoiceFooterText: e.target.value})}
                                className="textarea textarea-bordered h-28 focus:textarea-primary font-medium bg-base-50 text-base" 
                                placeholder="Thank you for your business! All goods are subject to Aligarh jurisdiction."
                            />
                            <label className="label"><span className="label-text-alt text-base-content/50 font-medium">This text will appear at the bottom of all generated PDFs and invoices.</span></label>
                        </div>

                        <div className="form-control mt-8 pt-8 border-t border-base-200">
                            <button type="submit" className="btn btn-primary lg:w-56 shadow-lg shadow-primary/30 ml-auto rounded-xl text-lg h-12" disabled={saving}>
                                {saving ? <span className="loading loading-spinner"></span> : <><Save size={20} /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* SUBSCRIPTION TAB */}
            {activeTab === 'subscription' && userData?.role === 'admin' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-8 border-b border-base-200 pb-4">
                        <h2 className="text-2xl font-bold text-base-content">Subscription Details</h2>
                        <p className="text-base-content/60 mt-1">Review your active plan, expiration limits, and limits.</p>
                    </div>

                    <div className="space-y-6 max-w-xl">
                        <div className="card bg-base-50 border border-base-200 p-6 rounded-2xl shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                               <span className="font-bold text-base-content/60 uppercase text-xs tracking-wider">Active Plan</span>
                               {userData.subscriptionPlan && typeof userData.subscriptionPlan === 'string' ? (
                                   <div className="badge badge-primary badge-lg font-bold capitalize">{userData.subscriptionPlan}</div>
                               ) : userData.subscriptionPlan?.name ? (
                                   <div className="badge badge-primary badge-lg font-bold">{userData.subscriptionPlan.name}</div>
                               ) : (
                                   <div className="badge badge-error badge-lg font-bold">No Plan Assigned</div>
                               )}
                            </div>

                            <div className="flex justify-between items-center border-t border-base-200 pt-4 mb-4">
                               <span className="font-bold text-base-content/60 uppercase text-xs tracking-wider">Billing Renewal Date</span>
                               <span className="font-bold text-lg">{userData.subscriptionExpiresAt ? new Date(userData.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}</span>
                            </div>

                            <div className="border-t border-base-200 pt-4">
                               <span className="font-bold text-base-content/60 uppercase text-xs tracking-wider mb-2 block">Storage Quotas</span>
                               {(() => {
                                   const plan = userData.subscriptionPlan;
                                   const rawLimit = (plan && plan.storageLimitMB) || 0;
                                   const limit = userData.customStorageLimitMB !== null && userData.customStorageLimitMB !== undefined ? userData.customStorageLimitMB : rawLimit;
                                   const hasCustomLimit = userData.customStorageLimitMB !== null && userData.customStorageLimitMB !== undefined;

                                   return (
                                       <div className="text-lg font-semibold flex items-center gap-2">
                                           {limit > 0 ? (
                                               <>
                                                   Maximum allowed capacity: {limit} MB
                                                   {hasCustomLimit && <div className="badge badge-secondary badge-sm ml-2">Custom</div>}
                                               </>
                                           ) : (
                                               <span className="text-success flex items-center gap-1">Unlimited Storage (Legacy)</span>
                                           )}
                                       </div>
                                   );
                               })()}
                            </div>
                        </div>

                        <div className="alert alert-info py-4 rounded-xl">
                            <span>To change your plan bundle or request additional DB storage capacity, please contact the Software Sales Team at padlocks@agency.com.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-8 border-b border-base-200 pb-4">
                        <h2 className="text-2xl font-bold text-base-content">Security Settings</h2>
                        <p className="text-base-content/60 mt-1">Update your password to keep your account secure.</p>
                    </div>
                    
                    <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-xl">
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold text-base-content/80 text-sm tracking-wide uppercase">Current Password</span></label>
                            <input 
                                type="password" 
                                value={passwords.oldPassword}
                                onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                                required
                                className="input input-bordered w-full focus:input-primary font-medium bg-base-50" 
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold text-base-content/80 text-sm tracking-wide uppercase">New Password</span></label>
                            <input 
                                type="password" 
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                                required
                                minLength="6"
                                className="input input-bordered w-full focus:input-primary font-medium bg-base-50" 
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold text-base-content/80 text-sm tracking-wide uppercase">Confirm New Password</span></label>
                            <input 
                                type="password" 
                                value={passwords.confirmPassword}
                                onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                                required
                                minLength="6"
                                className="input input-bordered w-full focus:input-primary font-medium bg-base-50" 
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="form-control mt-8 pt-8 border-t border-base-200">
                            <button type="submit" className="btn btn-primary lg:w-56 shadow-lg shadow-primary/30 rounded-xl text-lg h-12" disabled={saving}>
                                {saving ? <span className="loading loading-spinner"></span> : <><Key size={20} /> Update Password</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-8 border-b border-base-200 pb-4">
                        <h2 className="text-2xl font-bold text-base-content">Preferences</h2>
                        <p className="text-base-content/60 mt-1">Customize your system interface and experience.</p>
                    </div>
                    
                    <div className="space-y-8 max-w-xl">
                        <div>
                            <h3 className="font-bold text-base-content/80 text-sm tracking-wide uppercase mb-4">Interface Theme</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-base-200 hover:border-primary/50 hover:bg-base-50'}`}
                                    onClick={() => handleThemeChange('light')}
                                >
                                    <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 mb-3 flex items-center justify-center text-slate-700">☀️</div>
                                    <span className={`font-bold ${theme === 'light' ? 'text-primary' : 'text-base-content'}`}>Light Mode</span>
                                </button>
                                
                                <button 
                                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-base-200 hover:border-primary/50 hover:bg-base-50'}`}
                                    onClick={() => handleThemeChange('dark')}
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-800 shadow-sm border border-slate-700 mb-3 flex items-center justify-center text-white">🌙</div>
                                    <span className={`font-bold ${theme === 'dark' ? 'text-primary' : 'text-base-content'}`}>Dark Mode</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
