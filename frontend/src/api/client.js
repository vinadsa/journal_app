export const API_BASE = '/api';

let onUnauthorizedCallback = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorizedCallback = fn;
}

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
    if (res.status === 401 && onUnauthorizedCallback && path !== '/login' && path !== '/register') {
      onUnauthorizedCallback();
    }
    const err = new Error(data.message || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}
