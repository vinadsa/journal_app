export const API_BASE = '/api';

export async function request(method, path, body = null) {
  const opts = {
    method,
    headers: {},
    credentials: 'include',
  };

  if (body) {
    if (body instanceof FormData) {
      opts.body = body;
      // Let the browser set Content-Type with the correct boundary
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
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
