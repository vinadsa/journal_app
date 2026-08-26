import { request } from './client';

export const dashboardApi = {
  getDashboard: () => request('GET', '/dashboard'),
};
