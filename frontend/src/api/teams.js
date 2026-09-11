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

  /**
   * Upsert a calibration note for a team member in a KPI period.
   * @param {{ target_user_id: number, kpi_period_id?: number, note: string }} data
   */
  upsertCalibrationNote: (data) => request('PUT', '/teams/notes', data),

  /**
   * Get all calibration notes for the authenticated manager.
   * @param {number} [kpiPeriodId] - Optional KPI period filter
   */
  getCalibrationNotes: (kpiPeriodId) => {
    const params = new URLSearchParams();
    if (kpiPeriodId) params.set('kpi_period_id', String(kpiPeriodId));
    const qs = params.toString();
    return request('GET', `/teams/notes${qs ? '?' + qs : ''}`);
  },

  /**
   * Delete a calibration note by ID.
   * @param {number} noteId
   */
  deleteCalibrationNote: (noteId) => request('DELETE', `/teams/notes/${noteId}`),
};
