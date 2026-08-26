import { request } from './client';

export const journalsApi = {
  getJournals: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/journals${q ? '?' + q : ''}`);
  },
  createJournal: (data) => request('POST', '/journals', data),
  updateJournal: (id, data) => request('POST', `/journals/${id}`, data),
  deleteJournal: (id) => request('DELETE', `/journals/${id}`),

  getJournalTags: (journalId) => request('GET', `/journals/${journalId}/tags`),
  addTagToJournal: (journalId, tagId) => request('POST', `/journals/${journalId}/tags`, { tag_id: tagId }),
  removeTagFromJournal: (journalId, tagId) => request('DELETE', `/journals/${journalId}/tags/${tagId}`),

  getJournalAchievements: (journalId) => request('GET', `/journals/${journalId}/achievements`),
};
