import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock, AlertOctagon } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, user } = useAuthStore();
  const navigate = useNavigate();

  if (user) {
    if (user.role === 'superadmin') return <Navigate to="/superadmin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
               <Lock size={32} />
            </div>
          </div>
          <h2 className="card-title justify-center text-2xl font-bold mb-2">Padlock Admin</h2>
          <p className="text-center text-base-content/60 mb-6">Login to manage inventory and billing</p>
          
          {error && !error.includes('expired') && <div className="alert alert-error mb-4 text-sm font-medium py-2 rounded-lg"><span className="flex-1">{error}</span></div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-control w-full mb-4">
              <label className="label"><span className="label-text font-medium">Email</span></label>
              <input 
                type="email" 
                placeholder="admin@example.com" 
                className="input input-bordered w-full focus:input-primary transition-all" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-control w-full mb-6">
              <label className="label"><span className="label-text font-medium">Password</span></label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="input input-bordered w-full focus:input-primary transition-all" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-control mt-2">
              <button 
                type="submit" 
                className="btn btn-primary w-full shadow-lg shadow-primary/30"
                disabled={isLoading}
              >
                {isLoading ? <span className="loading loading-spinner"></span> : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <dialog className={`modal ${error && error.includes('expired') ? 'modal-open' : ''}`}>
        <div className="modal-box border border-error bg-error/10">
          <div className="flex flex-col items-center text-center">
            <AlertOctagon size={48} className="text-error mb-4" />
            <h3 className="font-bold text-2xl text-error mb-2">Plan Expired</h3>
            <p className="py-2 text-lg">{error}</p>
          </div>
          <div className="modal-action justify-center mt-6">
            <button className="btn btn-error text-white px-8" onClick={() => useAuthStore.setState({ error: null })}>Close</button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default Login;
