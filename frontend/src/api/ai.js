/**
 * AI API client for generating Review Summary via backend Gemini integration.
 * Calls POST /api/ai/synthesize which communicates with the Gemini API server-side.
 */

const API_BASE = '/api';

export const aiApi = {
  /**
   * Generates a review summary based on journals and achievements.
   * @param {Object} data - { journals: Array, achievements: Array, period: string, focusArea?: string }
   * @returns {Promise<Object>} Synthesis response matching AISynthesisCard schema
   */
  generateSynthesis: async (data) => {
    const headers = { 'Content-Type': 'application/json' };
    if (data.apiKey && data.apiKey.trim()) {
      headers['X-Gemini-Api-Key'] = data.apiKey.trim();
    }

    const res = await fetch(`${API_BASE}/ai/synthesize`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        period: data.period || '',
        journals: (data.journals || []).map(j => ({
          id: j.id,
          title: j.title || '',
          category: j.category || '',
          entry_date: j.entry_date || '',
          did_today: j.did_today || '',
          learnings: j.learnings || '',
          blockers: j.blockers || '',
          next_steps: j.next_steps || '',
          impact: j.impact || '',
        })),
        achievements: (data.achievements || []).map(a => ({
          id: a.id,
          title: a.title || '',
          description: a.description || '',
          impact: a.impact || '',
          importance: a.importance || 'medium',
          achieved_date: a.achieved_date || a.created_at || '',
        })),
        focusArea: data.focusArea || '',
        language: data.language || 'en',
        foundationContext: data.foundationContext || undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Review summary generation failed (${res.status})`);
    }

    return res.json();
  },
};
