import { request } from './client';

export const searchApi = {
  searchJournals: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const q = new URLSearchParams(clean).toString();
    return request('GET', `/search/journals${q ? '?' + q : ''}`);
  },
  searchAchievements: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const q = new URLSearchParams(clean).toString();
    return request('GET', `/search/achievements${q ? '?' + q : ''}`);
  },
};

