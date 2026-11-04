import { io, type Socket } from 'socket.io-client';
import { handleFallbackApiRequest } from './fallbackApi.ts';

const TOKEN_KEY = 'nlo_cup_auth_token';
export const API_BASE_URL: string =
  ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)
    ?.trim()
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '') || '';

function isLocalhostRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  // Static official logos & reference sheets live directly in Vercel's /content/images
  if (cleanPath.startsWith('/content/images/logos/') || cleanPath.startsWith('/content/images/references/')) {
    return cleanPath;
  }
  return `${API_BASE_URL}${cleanPath}`;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // If running on a static/serverless host (e.g. Vercel) without VITE_API_BASE_URL configured yet,
  // serve directly from the built-in verified NLO 2026/2027 dataset engine.
  if (!API_BASE_URL && !isLocalhostRuntime()) {
    return handleFallbackApiRequest<T>(path, options);
  }

  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const requestUrl = path.startsWith('http')
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const res = await fetch(requestUrl, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return handleFallbackApiRequest<T>(path, options);
    }

    const data = await res.json();
    if (!res.ok) {
      if (res.status >= 500) {
        return handleFallbackApiRequest<T>(path, options);
      }
      const err = new Error(data.error || `Request failed with status ${res.status}`) as Error & {
        status?: number;
        code?: string;
      };
      err.status = res.status;
      err.code = data.code;
      throw err;
    }

    return data as T;
  } catch (err: any) {
    if (err && typeof err.status === 'number' && err.status >= 400 && err.status < 500) {
      throw err;
    }
    return handleFallbackApiRequest<T>(path, options);
  }
}

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    const token = getStoredToken();
    const shouldConnect = Boolean(API_BASE_URL || isLocalhostRuntime());
    socketInstance = io(API_BASE_URL || '/', {
      path: '/socket.io',
      autoConnect: shouldConnect,
      transports: ['websocket', 'polling'],
      reconnection: shouldConnect,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      auth: token ? { token } : {},
    });
  }
  return socketInstance;
}

export function reconnectSocketWithAuth(): void {
  if (socketInstance && (API_BASE_URL || isLocalhostRuntime())) {
    socketInstance.auth = getStoredToken() ? { token: getStoredToken() } : {};
    socketInstance.disconnect().connect();
  }
}

export interface QueuedOfflineMatchEvent {
  idempotencyKey: string;
  matchId: string;
  payload: Record<string, any>;
  queuedAt: string;
}

const OFFLINE_QUEUE_KEY = 'nlo_cup_referee_offline_queue';

export function getOfflineEventQueue(matchId?: string): QueuedOfflineMatchEvent[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const list: QueuedOfflineMatchEvent[] = raw ? JSON.parse(raw) : [];
    return matchId ? list.filter((x) => x.matchId === matchId) : list;
  } catch {
    return [];
  }
}

export function enqueueOfflineMatchEvent(item: QueuedOfflineMatchEvent): void {
  const list = getOfflineEventQueue();
  if (!list.some((x) => x.idempotencyKey === item.idempotencyKey)) {
    list.push(item);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(list));
  }
}

export function removeOfflineMatchEvent(idempotencyKey: string): void {
  const list = getOfflineEventQueue().filter((x) => x.idempotencyKey !== idempotencyKey);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(list));
}
