import { io, type Socket } from 'socket.io-client';

const TOKEN_KEY = 'nlo_cup_auth_token';
export const API_BASE_URL: string =
  ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '';

export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
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

  const res = await fetch(requestUrl, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed with status ${res.status}`) as Error & {
      status?: number;
      code?: string;
    };
    err.status = res.status;
    err.code = data.code;
    throw err;
  }

  return data as T;
}

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    const token = getStoredToken();
    socketInstance = io(API_BASE_URL || '/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: token ? { token } : {},
    });
  }
  return socketInstance;
}

export function reconnectSocketWithAuth(): void {
  if (socketInstance) {
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

