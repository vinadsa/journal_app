import { request } from './client';

export const searchApi = {
  searchJournals: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/search/journals${q ? '?' + q : ''}`);
  },
};
