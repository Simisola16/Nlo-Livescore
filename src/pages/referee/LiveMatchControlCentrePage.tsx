import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Edit3,
  Lock,
  Pause,
  Play,
  PlusCircle,
  Radio,
  RefreshCw,
  ShieldAlert,
  Trash2,
  WifiOff,
} from 'lucide-react';
import type { FixtureView, MatchEventType, MatchEventView } from '@nlo-cup/package';
import { useApp } from '../../context/AppContext.tsx';
import {
  apiRequest,
  enqueueOfflineMatchEvent,
  getOfflineEventQueue,
  getSocket,
  removeOfflineMatchEvent,
} from '../../services/api.ts';
import { MatchStatusBadge, TeamCrest } from '../../components/SharedComponents.tsx';

function generateClientUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const LiveMatchControlCentrePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, referee, socketConnected, lastRealtimeTick } = useApp();
  const navigate = useNavigate();

  const [match, setMatch] = useState<FixtureView | null>(null);
  const [events, setEvents] = useState<MatchEventView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Event Recording Form State
  const [activeDrawer, setActiveDrawer] = useState<
    'GOAL' | 'YELLOW' | 'RED' | 'SUB' | 'OTHER' | 'STATS' | null
  >('GOAL');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [playerNumber, setPlayerNumber] = useState<string>('');
  const [secondaryPlayerName, setSecondaryPlayerName] = useState<string>('');
  const [eventMinute, setEventMinute] = useState<string>('1');
  const [extraMinute, setExtraMinute] = useState<string>('0');
  const [subEventType, setSubEventType] = useState<MatchEventType>('GOAL');
  const [description, setDescription] = useState<string>('');

  // Event Correction Modal State
  const [editingEvent, setEditingEvent] = useState<MatchEventView | null>(null);
  const [editPlayerName, setEditPlayerName] = useState<string>('');
  const [editMinute, setEditMinute] = useState<string>('1');
  const [editDescription, setEditDescription] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  // Offline Queue State
  const [offlineCount, setOfflineCount] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    socket.emit('join:match', id);
    return () => {
      socket.emit('leave:match', id);
    };
  }, [id]);

  const loadMatchData = async () => {
    if (!id) return;
    try {
      const res = await apiRequest<{
        match: FixtureView;
        events: MatchEventView[];
      }>(`/api/referee/matches/${encodeURIComponent(id)}`);
      setMatch(res.match);
      setEvents(res.events || []);
      if (!selectedTeamId && res.match.homeTeamId) {
        setSelectedTeamId(res.match.homeTeamId);
      }
      if (res.match.currentMinute && res.match.currentMinute > 0) {
        setEventMinute(String(res.match.currentMinute));
      }
      setOfflineCount(getOfflineEventQueue(res.match.matchId || res.match.id).length);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load match control centre');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchData();
  }, [id, lastRealtimeTick]);

  // Flush any offline queued events when socket/network is connected
  const flushOfflineQueue = async () => {
    if (!match) return;
    const targetId = match.matchId || match.id;
    const queue = getOfflineEventQueue(targetId);
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        await apiRequest(`/api/referee/matches/${encodeURIComponent(targetId)}/events`, {
          method: 'POST',
          body: JSON.stringify(item.payload),
        });
        removeOfflineMatchEvent(item.idempotencyKey);
      } catch {
        break;
      }
    }
    setOfflineCount(getOfflineEventQueue(targetId).length);
    await loadMatchData();
  };

  useEffect(() => {
    if (socketConnected && match) {
      flushOfflineQueue();
    }
  }, [socketConnected, match?.id]);

  const handleClaimLock = async () => {
    if (!match) return;
    setBusy(true);
    setError('');
    try {
      const targetId = match.matchId || match.id;
      const res = await apiRequest<{ match: FixtureView; events: MatchEventView[] }>(
        `/api/referee/matches/${encodeURIComponent(targetId)}/claim`,
        { method: 'POST' }
      );
      setMatch(res.match);
      setEvents(res.events || []);
      setStatusMessage('Match locked exclusively under your referee control.');
    } catch (err: any) {
      setError(err.message || 'Failed to lock match.');
    } finally {
      setBusy(false);
    }
  };

  const handleClockAction = async (
    action: string,
    extra: { currentMinute?: number; stoppageTimeAdded?: number } = {}
  ) => {
    if (!match) return;
    setBusy(true);
    setError('');
    setStatusMessage('');
    try {
      const targetId = match.matchId || match.id;
      const res = await apiRequest<{ match: FixtureView; events: MatchEventView[] }>(
        `/api/referee/matches/${encodeURIComponent(targetId)}/clock`,
        {
          method: 'POST',
          body: JSON.stringify({
            action,
            currentMinuteOverride: extra.currentMinute ?? match.currentMinute ?? 1,
            stoppageTimeMinutes: extra.stoppageTimeAdded ?? match.stoppageTimeAdded ?? 0,
          }),
        }
      );
      setMatch(res.match);
      setEvents(res.events || []);
      setStatusMessage(`Clock action applied: ${action.replace(/_/g, ' ')}`);
    } catch (err: any) {
      setError(err.message || 'Clock control action failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRecordEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    setError('');
    setStatusMessage('');

    let resolvedEventType: MatchEventType = subEventType;
    if (activeDrawer === 'YELLOW') resolvedEventType = 'YELLOW_CARD';
    if (activeDrawer === 'SUB') resolvedEventType = 'SUBSTITUTION';

    const idempotencyKey = generateClientUuid();
    const stopMin = Number(extraMinute) || 0;
    const payload = {
      idempotencyKey,
      teamId: selectedTeamId || match.homeTeamId,
      eventType: resolvedEventType === 'PENALTY_MISSED' ? 'MISSED_PENALTY' : resolvedEventType,
      period:
        match.currentPeriod && match.currentPeriod !== 'PRE_MATCH'
          ? match.currentPeriod
          : 'FIRST_HALF',
      matchMinute: Math.max(1, Number(eventMinute) || 1),
      stoppageMinute: stopMin > 0 ? stopMin : null,
      playerName: playerName.trim(),
      playerNumber: playerNumber ? Number(playerNumber) : null,
      secondaryPlayerName: secondaryPlayerName.trim() || null,
      reasonOrDescription: description.trim() || null,
    };

    const targetId = match.matchId || match.id;
    setBusy(true);
    try {
      const res = await apiRequest<{ match: FixtureView; events: MatchEventView[] }>(
        `/api/referee/matches/${encodeURIComponent(targetId)}/events`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      setMatch(res.match);
      setEvents(res.events || []);
      setPlayerName('');
      setPlayerNumber('');
      setSecondaryPlayerName('');
      setDescription('');
      setStatusMessage(`${resolvedEventType.replace(/_/g, ' ')} recorded and broadcast live!`);
    } catch (err: any) {
      // If network error, queue offline with idempotency key
      if (!navigator.onLine || err.message?.includes('Failed to fetch')) {
        enqueueOfflineMatchEvent({
          idempotencyKey,
          matchId: targetId,
          payload,
          queuedAt: new Date().toISOString(),
        });
        setOfflineCount(getOfflineEventQueue(targetId).length);
        setStatusMessage(
          'Offline mode: Event saved to local queue with idempotency key and will sync automatically.'
        );
      } else {
        setError(err.message || 'Failed to record match event.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCorrectOrVoidEvent = async (isDeleted: boolean) => {
    if (!match || !editingEvent) return;
    if (correctionReason.trim().length < 3) {
      setError('Please enter a brief audit reason for this correction (at least 3 characters).');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const targetId = match.matchId || match.id;
      const res = await apiRequest<{ match: FixtureView; events: MatchEventView[] }>(
        `/api/referee/matches/${encodeURIComponent(targetId)}/events/${encodeURIComponent(
          editingEvent.id
        )}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            playerName: editPlayerName.trim(),
            matchMinute: Number(editMinute) || editingEvent.matchMinute,
            reasonOrDescription: editDescription.trim() || null,
            isDeleted,
            correctionReason: correctionReason.trim(),
          }),
        }
      );
      setMatch(res.match);
      setEvents(res.events || []);
      setEditingEvent(null);
      setCorrectionReason('');
      setStatusMessage(
        isDeleted
          ? 'Event voided and match score/statistics recalculated.'
          : 'Event corrected and match score/statistics recalculated.'
      );
    } catch (err: any) {
      setError(err.message || 'Event correction failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        Initializing Referee Live Match Control Centre...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-xl font-extrabold text-slate-900">
          {error || 'Match Control Access Denied'}
        </h2>
        <Link
          to="/referee"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nlo-navy text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Referee Dashboard
        </Link>
      </div>
    );
  }

  const isLockedByMe =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    match.lockedByRefereeId === referee?.id;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-5 space-y-5 pb-16">
      {/* Top Navigation & Connection Bar */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/referee"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-nlo-navy"
        >
          <ArrowLeft className="w-4 h-4" />
          Referee Dashboard
        </Link>

        <div className="flex items-center gap-2">
          {offlineCount > 0 && (
            <button
              type="button"
              onClick={flushOfflineQueue}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300"
            >
              <WifiOff className="w-3.5 h-3.5" />
              {offlineCount} Queued Offline (Tap to Sync)
            </button>
          )}
          <Link
            to={`/matches/${match.matchId || match.id}`}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Public Match View →
          </Link>
        </div>
      </div>

      {/* Match Scoreboard & Lock Banner */}
      <div className="rounded-2xl bg-slate-950 text-white p-5 border-b-4 border-emerald-500 shadow-2xl space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-300 pb-3 border-b border-slate-800">
          <span className="font-bold text-emerald-400">
            {match.groupName} • Wk {match.weekNumber} (M/NO {match.matchNumber})
          </span>
          <MatchStatusBadge
            status={match.matchStatus || match.fixtureStatus}
            minute={match.currentMinute}
            stoppage={match.stoppageTimeAdded}
          />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center text-center gap-1.5">
            <TeamCrest
              name={match.homeTeamName}
              logoUrl={match.homeTeamLogoUrl}
              hasOfficialLogo={match.homeTeamHasOfficialLogo}
              size="md"
            />
            <span className="font-extrabold text-xs sm:text-sm text-white leading-tight">
              {match.homeTeamName}
            </span>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-center min-w-[125px]">
            <div className="font-mono font-extrabold text-3xl sm:text-4xl tracking-wider">
              {match.homeScore ?? 0} : {match.awayScore ?? 0}
            </div>
            <div className="text-[11px] font-mono text-emerald-400 mt-1">
              {match.currentPeriod || 'PRE-MATCH'} • {match.currentMinute ?? 0}&apos;
              {match.stoppageTimeAdded ? `+${match.stoppageTimeAdded}'` : ''}
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-1.5">
            <TeamCrest
              name={match.awayTeamName}
              logoUrl={match.awayTeamLogoUrl}
              hasOfficialLogo={match.awayTeamHasOfficialLogo}
              size="md"
            />
            <span className="font-extrabold text-xs sm:text-sm text-white leading-tight">
              {match.awayTeamName}
            </span>
          </div>
        </div>

        {/* Lock Ownership Banner */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            {match.lockedByRefereeName
              ? `Locked by: ${match.lockedByRefereeName} (${match.lockedByRefereeNumber || 'Official'})`
              : 'Match Not Yet Locked'}
          </span>

          {!isLockedByMe && (
            <button
              type="button"
              disabled={busy}
              onClick={handleClaimLock}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs"
            >
              Claim & Lock Match Control
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2 text-xs text-rose-900">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {statusMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-2 text-xs text-emerald-950 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 1. Touchline Match Clock & Period Controls */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-700" />
            1. Match Clock & Period Control
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <label className="font-bold text-slate-600">Minute:</label>
            <input
              type="number"
              min={0}
              max={130}
              value={match.currentMinute ?? 0}
              onChange={(e) =>
                handleClockAction('RECORD_STOPPAGE_TIME', {
                  currentMinute: Number(e.target.value),
                  stoppageTimeAdded: match.stoppageTimeAdded ?? 0,
                })
              }
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center font-mono font-bold text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => handleClockAction('START_MATCH', { currentMinute: 1 })}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Kick Off (1H)
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => handleClockAction('RECORD_HALF_TIME', { currentMinute: 45 })}
            className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs"
          >
            Half Time (HT)
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => handleClockAction('START_SECOND_HALF', { currentMinute: 46 })}
            className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs"
          >
            Start 2nd Half (46&apos;)
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => handleClockAction('RECORD_FULL_TIME', { currentMinute: 90 })}
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs"
          >
            Full Time (FT)
          </button>
        </div>

        {/* Secondary Clock Controls: Pause, Resume, Stoppage Time, Extra Time, Suspend */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => handleClockAction('PAUSE_MATCH')}
            className="py-2 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center gap-1"
          >
            <Pause className="w-3 h-3" /> Pause
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleClockAction('RESUME_MATCH')}
            className="py-2 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center gap-1"
          >
            <Play className="w-3 h-3" /> Resume
          </button>
          {[2, 4, 6].map((addMin) => (
            <button
              key={addMin}
              type="button"
              disabled={busy}
              onClick={() =>
                handleClockAction('RECORD_STOPPAGE_TIME', {
                  currentMinute: match.currentMinute || 45,
                  stoppageTimeAdded: addMin,
                })
              }
              className="py-2 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-mono font-bold text-[11px]"
            >
              +{addMin}&apos; Added
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => handleClockAction('SUSPEND_MATCH')}
            className="py-2 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[11px]"
          >
            Suspend
          </button>
        </div>
      </div>

      {/* 2. Quick Event Recording Selector Tabs (Mobile-First Touch Buttons) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <PlusCircle className="w-4 h-4 text-emerald-700" />
          2. Record Live Match Event
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveDrawer('GOAL');
              setSubEventType('GOAL');
            }}
            className={`py-2.5 px-3 rounded-xl font-extrabold text-xs border transition-all ${
              activeDrawer === 'GOAL'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            ⚽ Goal
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveDrawer('YELLOW');
              setSubEventType('YELLOW_CARD');
            }}
            className={`py-2.5 px-3 rounded-xl font-extrabold text-xs border transition-all ${
              activeDrawer === 'YELLOW'
                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            🟨 Yellow Card
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveDrawer('RED');
              setSubEventType('RED_CARD');
            }}
            className={`py-2.5 px-3 rounded-xl font-extrabold text-xs border transition-all ${
              activeDrawer === 'RED'
                ? 'bg-rose-600 text-white border-rose-600 shadow'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            🟥 Red Card
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveDrawer('SUB');
              setSubEventType('SUBSTITUTION');
            }}
            className={`py-2.5 px-3 rounded-xl font-extrabold text-xs border transition-all ${
              activeDrawer === 'SUB'
                ? 'bg-sky-600 text-white border-sky-600 shadow'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            🔄 Substitution
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveDrawer('OTHER');
              setSubEventType('PENALTY_MISSED');
            }}
            className={`py-2.5 px-3 rounded-xl font-extrabold text-xs border transition-all ${
              activeDrawer === 'OTHER'
                ? 'bg-nlo-navy text-white border-nlo-navy shadow'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            ⚠️ Incident / Pen
          </button>
        </div>

        {/* Event Entry Form */}
        {activeDrawer && activeDrawer !== 'STATS' && (
          <form
            onSubmit={handleRecordEvent}
            className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3"
          >
            {/* Team Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTeamId(match.homeTeamId || '')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border text-left truncate ${
                  selectedTeamId === match.homeTeamId
                    ? 'bg-nlo-navy text-white border-nlo-navy'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                HOME: {match.homeTeamName}
              </button>
              <button
                type="button"
                onClick={() => setSelectedTeamId(match.awayTeamId || '')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border text-left truncate ${
                  selectedTeamId === match.awayTeamId
                    ? 'bg-nlo-navy text-white border-nlo-navy'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                AWAY: {match.awayTeamName}
              </button>
            </div>

            {/* Sub-type selector for Goal, Red Card, or Other */}
            {activeDrawer === 'GOAL' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Goal Type</label>
                <select
                  value={subEventType}
                  onChange={(e) => setSubEventType(e.target.value as MatchEventType)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold"
                >
                  <option value="GOAL">Normal Goal (Open Play / Set Piece)</option>
                  <option value="PENALTY_GOAL">Penalty Goal</option>
                  <option value="OWN_GOAL">Own Goal (Credits Opponent Score)</option>
                </select>
              </div>
            )}

            {activeDrawer === 'RED' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Red Card Type
                </label>
                <select
                  value={subEventType}
                  onChange={(e) => setSubEventType(e.target.value as MatchEventType)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold"
                >
                  <option value="RED_CARD">Direct Red Card</option>
                  <option value="SECOND_YELLOW_RED">Second Yellow → Red Card</option>
                </select>
              </div>
            )}

            {activeDrawer === 'OTHER' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Event Type
                </label>
                <select
                  value={subEventType}
                  onChange={(e) => setSubEventType(e.target.value as MatchEventType)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold"
                >
                  <option value="PENALTY_MISSED">Penalty Missed / Saved</option>
                  <option value="INJURY">Player Injury Stoppage</option>
                  <option value="INCIDENT">Match Incident / Official Note</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {activeDrawer === 'SUB' ? 'Player Coming IN *' : 'Player Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="e.g. Musa Abdullahi"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Jersey # (Opt)
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={playerNumber}
                  onChange={(e) => setPlayerNumber(e.target.value)}
                  placeholder="9"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            {(activeDrawer === 'GOAL' || activeDrawer === 'SUB') && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {activeDrawer === 'SUB' ? 'Player Going OUT *' : 'Assist Player (Optional)'}
                </label>
                <input
                  type="text"
                  required={activeDrawer === 'SUB'}
                  value={secondaryPlayerName}
                  onChange={(e) => setSecondaryPlayerName(e.target.value)}
                  placeholder={
                    activeDrawer === 'SUB' ? 'Player being replaced' : 'Player who provided assist'
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Match Minute *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={130}
                  value={eventMinute}
                  onChange={(e) => setEventMinute(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Stoppage (+Min)
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={extraMinute}
                  onChange={(e) => setExtraMinute(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Reason / Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional note..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all"
            >
              {busy ? 'Broadcasting Event...' : 'Submit & Broadcast Match Event Live'}
            </button>
          </form>
        )}
      </div>

      {/* 3. Recorded Timeline Events & Audited Event Correction */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
            3. Recorded Timeline Events & Audited Correction ({events.length})
          </h2>
          <span className="text-[11px] text-slate-500">
            Corrections auto-recalculate scores & log audit history
          </span>
        </div>

        {events.length > 0 ? (
          <div className="space-y-2">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold px-2 py-0.5 rounded bg-nlo-navy text-white">
                      {ev.matchMinute}&apos;
                    </span>
                    <strong className="text-slate-900">
                      {ev.eventType.replace(/_/g, ' ')} — {ev.playerName}
                    </strong>
                    <span className="text-slate-500">({ev.teamName})</span>
                  </div>
                  {ev.description && (
                    <p className="text-[11px] text-slate-500 mt-1">{ev.description}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(ev);
                    setEditPlayerName(ev.playerName);
                    setEditMinute(String(ev.matchMinute));
                    setEditDescription(ev.description || '');
                    setCorrectionReason('');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-slate-300 text-slate-700 font-bold text-[11px]"
                >
                  <Edit3 className="w-3 h-3 text-amber-600" />
                  Correct / Void
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">
            No timeline events recorded yet for this match.
          </p>
        )}
      </div>

      {/* Audited Event Correction Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              Correct or Void Match Event ({editingEvent.eventType})
            </h3>
            <p className="text-xs text-slate-600">
              All event corrections are non-destructive: the previous state, new state, and your
              reason are logged in the NLO Secretariat Audit Trail, and the match score is
              recalculated automatically.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Player Name</label>
                <input
                  type="text"
                  value={editPlayerName}
                  onChange={(e) => setEditPlayerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Match Minute</label>
                <input
                  type="number"
                  min={1}
                  max={130}
                  value={editMinute}
                  onChange={(e) => setEditMinute(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Audit Reason for Correction *
                </label>
                <input
                  type="text"
                  required
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Corrected scorer jersey/name after 4th official check"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleCorrectOrVoidEvent(true)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Void Event
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleCorrectOrVoidEvent(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold"
                >
                  Save Correction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
