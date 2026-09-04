import { request } from './client';

export const achievementsApi = {
  createAchievement: (data) => request('POST', '/achievements', data),
  listAchievements: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/achievements${q ? '?' + q : ''}`);
  },
  getAchievement: (id) => request('GET', `/achievements/${id}`),
  updateAchievement: (id, data) => request('PUT', `/achievements/${id}`, data),
  deleteAchievement: (id) => request('DELETE', `/achievements/${id}`),
  getAchievementJournals: (id) => request('GET', `/achievements/${id}/journals`),
  linkJournalToAchievement: (id, journalId) => request('POST', `/achievements/${id}/journals`, { journal_id: journalId }),
  unlinkJournalFromAchievement: (id, journalId) => request('DELETE', `/achievements/${id}/journals/${journalId}`),
};
