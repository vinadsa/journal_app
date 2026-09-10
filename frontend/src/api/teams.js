import { request } from './client';

export const teamsApi = {
  createTeam: (data) => request('POST', '/teams', data),

  /**
   * Fetch team overview with optional date-bounded period filtering.
   * @param {Object} [params] - Optional params
   * @param {string} [params.startDate] - Start date (YYYY-MM-DD) for period filtering
   * @param {string} [params.endDate] - End date (YYYY-MM-DD) for period filtering
   * @returns {Promise<Object>} Team overview response
   */
  getTeamOverview: ({ startDate, endDate } = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const qs = params.toString();
    return request('GET', `/teams/overview${qs ? '?' + qs : ''}`);
  },
};
