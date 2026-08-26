import { request } from './client';

export const tagsApi = {
  createTag: (name) => request('POST', '/tags', { name }),
  listTags: () => request('GET', '/tags'),
  deleteTag: (id) => request('DELETE', `/tags/${id}`),
};
