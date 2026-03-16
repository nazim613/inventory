import { create } from 'zustand';
import API from '../api/axios';

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('padlock_user')) || null,
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await API.post('/auth/login', { email, password });
            localStorage.setItem('padlock_user', JSON.stringify(data));
            set({ user: data, isLoading: false });
            return true;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Login failed', 
                isLoading: false 
            });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('padlock_user');
        set({ user: null });
    }
}));

export default useAuthStore;
