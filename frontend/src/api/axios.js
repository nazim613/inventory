import axios from 'axios';

const API = axios.create({
    baseURL: 'https://inventory-4r4g.onrender.com/api',
});

API.interceptors.request.use((req) => {
    const user = JSON.parse(localStorage.getItem('padlock_user'));
    if (user && user.token) {
        req.headers.Authorization = `Bearer ${user.token}`;
    }
    return req;
});

export default API;
