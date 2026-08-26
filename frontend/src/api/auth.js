import { request } from './client';

export const authApi = {
  login: (email, password) => request('POST', '/login', { email, password }),
  register: (name, email, password) => request('POST', '/register', { name, email, password }),
  logout: () => request('POST', '/logout'),
};
