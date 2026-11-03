import React, { useEffect, useState } from 'react';
import { Filter, Flame, Radio, RefreshCw, Search } from 'lucide-react';
import type { FixtureView } from '@nlo-cup/package';
import { useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../services/api.ts';
import { MatchCard } from '../../components/SharedComponents.tsx';

export const LiveScoresPage: React.FC = () => {
  const {
    seasons,
    selectedSeasonId,
    setSelectedSeasonId,
    zones,
    groups,
    socketConnected,
    lastRealtimeTick,
  } = useApp();

  const [fixtures, setFixtures] = useState<FixtureView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [parentZoneId, setParentZoneId] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('LIVE_ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredGroups = parentZoneId
    ? groups.filter((g) => g.parentZoneId === parentZoneId)
    : groups;

  useEffect(() => {
    let active = true;
    const loadMatches = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSeasonId) params.set('seasonId', selectedSeasonId);
        if (parentZoneId) params.set('parentZoneId', parentZoneId);
        if (groupId) params.set('groupId', groupId);
        if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter);
        if (dateFilter) params.set('date', dateFilter);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        params.set('includeByes', 'false');

        const res = await apiRequest<{ fixtures: FixtureView[] }>(
          `/api/public/fixtures?${params.toString()}`
        );
        if (active) {
          setFixtures(res.fixtures);
        }
      } catch (err) {
        console.error('Failed to load live scores:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadMatches();
    return () => {
      active = false;
    };
  }, [selectedSeasonId, parentZoneId, groupId, statusFilter, dateFilter, searchQuery, lastRealtimeTick]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-nlo-navy text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-rose-600 shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse-live" />
            Real-Time Match Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            NLO Cup Live Scoreboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Live match clocks, instant goal alerts, cards, substitutions, and status filters across
            all 7 Official Competition Centres.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs flex items-center gap-2">
            <Radio
              className={`w-4 h-4 ${
                socketConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
              }`}
            />
            <span>
              WebSocket:{' '}
              <strong className={socketConnected ? 'text-emerald-400' : 'text-amber-300'}>
                {socketConnected ? 'Connected (Zero-Refresh)' : 'Reconnecting'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            Filter Scoreboard
          </span>
          <button
            type="button"
            onClick={() => {
              setParentZoneId('');
              setGroupId('');
              setStatusFilter('ALL');
              setDateFilter('');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Show All Matches
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Season</label>
            <select
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Geopolitical Zone
            </label>
            <select
              value={parentZoneId}
              onChange={(e) => {
                setParentZoneId(e.target.value);
                setGroupId('');
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="">All 4 Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Group / Centre
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="">All Centres</option>
              {filteredGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Match Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="LIVE_ALL">In-Play Only (LIVE / HT / SUSPENDED)</option>
              <option value="ALL">All Match Statuses</option>
              <option value="LIVE">LIVE</option>
              <option value="HT">HT (Half Time)</option>
              <option value="FT">FT (Full Time)</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="RESULT_PENDING">RESULT PENDING</option>
              <option value="POSTPONED">POSTPONED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Match Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Team or Venue Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search club or stadium..."
                className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-xs text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="rounded-xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
          Synchronizing live scoreboard...
        </div>
      ) : fixtures.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-600">
            Showing {fixtures.length} match{fixtures.length === 1 ? '' : 'es'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fixtures.map((fx) => (
              <MatchCard key={fx.id} fixture={fx} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-3">
          <Flame className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-extrabold text-slate-900">
            {statusFilter === 'LIVE_ALL'
              ? 'No Matches Currently In-Play Right Now'
              : 'No Matches Match Your Selected Filters'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            {statusFilter === 'LIVE_ALL'
              ? 'Switch the status filter to "All Match Statuses" or "UPCOMING" to inspect scheduled fixtures while waiting for match kick-offs.'
              : 'Try clearing one or more filters to view all 252 playable NLO Cup matches.'}
          </p>
          {statusFilter === 'LIVE_ALL' && (
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-nlo-navy text-white text-xs font-bold hover:bg-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Show All 252 Playable Matches
            </button>
          )}
        </div>
      )}
    </div>
  );
};

