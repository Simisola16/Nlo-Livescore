import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  CompetitionGroup,
  NotificationRecord,
  ParentZone,
  RefereeProfile,
  Season,
  User,
} from '@nlo-cup/package';
import {
  apiRequest,
  getSocket,
  getStoredToken,
  reconnectSocketWithAuth,
  setStoredToken,
} from '../services/api.ts';

export interface ZoneWithGroups extends ParentZone {
  groups: (CompetitionGroup & { teamsCount?: number; playableFixturesCount?: number })[];
}

interface AppContextValue {
  user: User | null;
  referee: RefereeProfile | null;
  authLoading: boolean;
  seasons: Season[];
  selectedSeasonId: string;
  setSelectedSeasonId: (id: string) => void;
  zones: ZoneWithGroups[];
  groups: CompetitionGroup[];
  notifications: NotificationRecord[];
  liveToast: NotificationRecord | null;
  dismissToast: () => void;
  socketConnected: boolean;
  lastRealtimeTick: number;
  refreshMetadata: () => Promise<void>;
  refreshSession: () => Promise<void>;
  loginWithToken: (token: string, user: User, referee: RefereeProfile | null) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [referee, setReferee] = useState<RefereeProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [zones, setZones] = useState<ZoneWithGroups[]>([]);
  const [groups, setGroups] = useState<CompetitionGroup[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [liveToast, setLiveToast] = useState<NotificationRecord | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [lastRealtimeTick, setLastRealtimeTick] = useState<number>(Date.now());

  const refreshMetadata = useCallback(async (seasonOverride?: string) => {
    try {
      const seasonsRes = await apiRequest<{ seasons: Season[] }>('/api/public/seasons');
      setSeasons(seasonsRes.seasons);
      const activeSeason =
        seasonsRes.seasons.find((s) => s.isActive) || seasonsRes.seasons[0];
      const targetSeasonId = seasonOverride || selectedSeasonId || activeSeason?.id || '';
      if (targetSeasonId && targetSeasonId !== selectedSeasonId) {
        setSelectedSeasonId(targetSeasonId);
      }
      if (targetSeasonId) {
        const zonesRes = await apiRequest<{
          zones: ZoneWithGroups[];
          groups: CompetitionGroup[];
        }>(`/api/public/zones?seasonId=${encodeURIComponent(targetSeasonId)}`);
        setZones(zonesRes.zones);
        setGroups(zonesRes.groups);
      }
    } catch (err) {
      console.error('Failed to load competition metadata:', err);
    }
  }, [selectedSeasonId]);

  const refreshSession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setReferee(null);
      setAuthLoading(false);
      return;
    }
    try {
      const me = await apiRequest<{
        user: User;
        referee: RefereeProfile | null;
        notifications: NotificationRecord[];
      }>('/api/auth/me');
      setUser(me.user);
      setReferee(me.referee);
      setNotifications(me.notifications || []);
    } catch {
      setStoredToken(null);
      setUser(null);
      setReferee(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMetadata();
    refreshSession();
  }, []);

  useEffect(() => {
    if (selectedSeasonId) {
      apiRequest<{ zones: ZoneWithGroups[]; groups: CompetitionGroup[] }>(
        `/api/public/zones?seasonId=${encodeURIComponent(selectedSeasonId)}`
      )
        .then((res) => {
          setZones(res.zones);
          setGroups(res.groups);
        })
        .catch(() => {});
    }
  }, [selectedSeasonId]);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    const onRealtimeUpdate = () => setLastRealtimeTick(Date.now());
    const onNotification = (notif: NotificationRecord) => {
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)].slice(0, 40));
      setLiveToast(notif);
      setLastRealtimeTick(Date.now());
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('match:updated', onRealtimeUpdate);
    socket.on('match:event', onRealtimeUpdate);
    socket.on('standings:updated', onRealtimeUpdate);
    socket.on('notification:new', onNotification);

    if (socket.connected) setSocketConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('match:updated', onRealtimeUpdate);
      socket.off('match:event', onRealtimeUpdate);
      socket.off('standings:updated', onRealtimeUpdate);
      socket.off('notification:new', onNotification);
    };
  }, []);

  const loginWithToken = (token: string, nextUser: User, nextRef: RefereeProfile | null) => {
    setStoredToken(token);
    setUser(nextUser);
    setReferee(nextRef);
    reconnectSocketWithAuth();
    refreshSession();
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
    setReferee(null);
    reconnectSocketWithAuth();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        referee,
        authLoading,
        seasons,
        selectedSeasonId,
        setSelectedSeasonId,
        zones,
        groups,
        notifications,
        liveToast,
        dismissToast: () => setLiveToast(null),
        socketConnected,
        lastRealtimeTick,
        refreshMetadata,
        refreshSession,
        loginWithToken,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

