/** Small REST client. Errors are thrown as ApiError with the server's code and message. */
import { Platform } from 'react-native';
import { API_URL } from './config';

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(method, path, { body, query, form, timeoutMs = 30000 } = {}) {
  let url = `${API_URL}/api${path}`;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }
  const headers = { Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  let payload;
  if (form) {
    payload = form; // let fetch set the multipart boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, { method, headers, body: payload, signal: controller.signal });
  } catch (err) {
    throw new ApiError(0, err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK', err.message);
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response
  }
  if (!res.ok) {
    const e = data?.error || {};
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    throw new ApiError(res.status, e.code || 'ERROR', e.message || `Request failed (${res.status})`, e.details);
  }
  return data;
}

/** Builds a multipart form from fields and picked images ({ uri, mimeType, fileName }). */
export async function buildForm(fields = {}, files = [], fileField = 'photos') {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    form.append(k, Array.isArray(v) || typeof v === 'object' ? JSON.stringify(v) : String(v));
  });
  for (const [i, f] of files.entries()) {
    const name = f.fileName || `photo-${Date.now()}-${i}.jpg`;
    const type = f.mimeType || 'image/jpeg';
    if (Platform.OS === 'web') {
      const blob = await (await fetch(f.uri)).blob();
      form.append(fileField, blob, name);
    } else {
      form.append(fileField, { uri: f.uri, name, type });
    }
  }
  return form;
}

export const api = {
  get: (p, query) => request('GET', p, { query }),
  post: (p, body) => request('POST', p, { body }),
  patch: (p, body) => request('PATCH', p, { body }),
  put: (p, body) => request('PUT', p, { body }),
  del: (p, query) => request('DELETE', p, { query }),
  upload: (p, form, timeoutMs = 120000) => request('POST', p, { form, timeoutMs }),
};
