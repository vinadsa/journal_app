const API_BASE = '/api';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: {},
    credentials: 'include',
  };

  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

// Auth
export const api = {
  login: (email, password) => request('POST', '/login', { email, password }),
  register: (name, email, password) => request('POST', '/register', { name, email, password }),
  logout: () => request('POST', '/logout'),

  // Journals
  getJournals: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/journals${q ? '?' + q : ''}`);
  },
  createJournal: (data) => request('POST', '/journals', data),
  updateJournal: (id, data) => request('POST', `/journals/${id}`, data),
  deleteJournal: (id) => request('DELETE', `/journals/${id}`),

  // Journal Tags
  getJournalTags: (journalId) => request('GET', `/journals/${journalId}/tags`),
  addTagToJournal: (journalId, tagId) => request('POST', `/journals/${journalId}/tags`, { tag_id: tagId }),
  removeTagFromJournal: (journalId, tagId) => request('DELETE', `/journals/${journalId}/tags/${tagId}`),

  // Journal Achievements
  getJournalAchievements: (journalId) => request('GET', `/journals/${journalId}/achievements`),

  // Tags
  createTag: (name) => request('POST', '/tags', { name }),
  listTags: () => request('GET', '/tags'),
  deleteTag: (id) => request('DELETE', `/tags/${id}`),

  // Achievements
  createAchievement: (data) => request('POST', '/achievements', data),
  listAchievements: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/achievements${q ? '?' + q : ''}`);
  },
  getAchievement: (id) => request('GET', `/achievements/${id}`),
  updateAchievement: (id, data) => request('PUT', `/achievements/${id}`, data),
  deleteAchievement: (id) => request('DELETE', `/achievements/${id}`),

  // Search
  searchJournals: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/search/journals${q ? '?' + q : ''}`);
  },

  // Teams
  createTeam: (data) => request('POST', '/teams', data),

  // Dashboard (composite — will call multiple endpoints)
  getDashboard: () => request('GET', '/dashboard'),
};
