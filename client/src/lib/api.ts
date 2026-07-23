/** Thin fetch wrapper. Cookies carry the auth token; we also keep it in memory. */

export class ApiError extends Error {
  status: number;
  issues?: { path: string; message: string }[];
  constructor(status: number, message: string, issues?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

let authToken: string | null = localStorage.getItem('bakar_token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('bakar_token', token);
  else localStorage.removeItem('bakar_token');
}

export function getToken() {
  return authToken;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data && (data.error as string)) || `Ошибка ${res.status}`;
    throw new ApiError(res.status, msg, data?.issues);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};

/** Uploads a file (image or PDF) and returns its public URL path. */
export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const headers: Record<string, string> = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, (data && data.error) || 'Не удалось загрузить файл');
  return data.url as string;
}

/** Resolves a stored image path to a usable src. */
export function mediaUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return path; // /uploads/... is proxied by Vite in dev and same-origin in prod
}
