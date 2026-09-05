import { request } from './client';

export const kpiPeriodsApi = {
  listKPIPeriods: () => request('GET', '/kpi-periods'),
  getActiveKPIPeriod: () => request('GET', '/kpi-periods/active'),
  getKPIPeriod: (id) => request('GET', `/kpi-periods/${id}`),
  createKPIPeriod: (data) => request('POST', '/kpi-periods', data),
};
