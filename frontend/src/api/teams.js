import { request } from './client';

export const teamsApi = {
  createTeam: (data) => request('POST', '/teams', data),
};
