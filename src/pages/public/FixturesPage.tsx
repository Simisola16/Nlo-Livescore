import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Clock, Filter, Info, Search } from 'lucide-react';
import type { FixtureView } from '@nlo-cup/package';
import { useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../services/api.ts';
import { MatchCard } from '../../components/SharedComponents.tsx';

export const FixturesPage: React.FC = () => {
  const { selectedSeasonId, zones, groups, lastRealtimeTick } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [fixtures, setFixtures] = useState<FixtureView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [parentZoneId, setParentZoneId] = useState<string>(
    searchParams.get('parentZoneId') || ''
  );
  const [groupId, setGroupId] = useState<string>(searchParams.get('groupId') || '');
  const [weekNumber, setWeekNumber] = useState<string>(searchParams.get('weekNumber') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [onlyTbc, setOnlyTbc] = useState<boolean>(searchParams.get('isKickoffTbc') === 'true');
  const [includeByes, setIncludeByes] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredGroups = parentZoneId
    ? groups.filter((g) => g.parentZoneId === parentZoneId)
    : groups;

  useEffect(() => {
    let active = true;
    const loadFixtures = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSeasonId) params.set('seasonId', selectedSeasonId);
        if (parentZoneId) params.set('parentZoneId', parentZoneId);
        if (groupId) params.set('groupId', groupId);
        if (weekNumber) params.set('weekNumber', weekNumber);
        if (statusFilter) params.set('status', statusFilter);
        if (dateFilter) params.set('date', dateFilter);
        if (onlyTbc) params.set('isKickoffTbc', 'true');
        params.set('includeByes', includeByes ? 'true' : 'false');
        if (searchQuery.trim()) params.set('search', searchQuery.trim());

        const res = await apiRequest<{ fixtures: FixtureView[] }>(
          `/api/public/fixtures?${params.toString()}`
        );
        if (active) {
          setFixtures(res.fixtures);
        }
      } catch (err) {
        console.error('Failed to load fixtures:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadFixtures();
    return () => {
      active = false;
    };
  }, [
    selectedSeasonId,
    parentZoneId,
    groupId,
    weekNumber,
    statusFilter,
    dateFilter,
    onlyTbc,
    includeByes,
    searchQuery,
    lastRealtimeTick,
  ]);

  const playableCount = fixtures.filter((f) => !f.isBye).length;
  const byeCount = fixtures.filter((f) => f.isBye).length;
  const tbcCount = fixtures.filter((f) => f.isKickoffTbc).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-nlo-navy text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-emerald-500">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5" />
            Verified Against All 18 Official NLO Secretariat Reference Sheets
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Official NLO Cup Fixtures & Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            252 Playable Matches + 10 Explicit Weekly BYE Slots (North West Zone Group B — Team 6
            BYE). Past unconfirmed fixtures are clearly marked{' '}
            <strong className="text-amber-300">RESULT PENDING</strong>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase">Playable Shown</span>
            <strong className="text-base font-mono text-white">{playableCount}</strong>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase">BYE Slots</span>
            <strong className="text-base font-mono text-emerald-400">{byeCount}</strong>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase">Kickoff TBC</span>
            <strong className="text-base font-mono text-amber-300">{tbcCount}</strong>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            Filter Official Fixtures
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeByes}
                onChange={(e) => setIncludeByes(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Show 10 Weekly BYE Entries
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyTbc}
                onChange={(e) => setOnlyTbc(e.target.checked)}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              Only TBC Kickoff Times (12)
            </label>
            <button
              type="button"
              onClick={() => {
                setParentZoneId('');
                setGroupId('');
                setWeekNumber('');
                setStatusFilter('');
                setDateFilter('');
                setOnlyTbc(false);
                setIncludeByes(true);
                setSearchQuery('');
                setSearchParams({});
              }}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
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
              Competition Group / Centre
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="">All 7 Centres</option>
              {filteredGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Match Week</label>
            <select
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="">All Weeks (Wk 1 – Wk 18)</option>
              {Array.from({ length: 18 }, (_, i) => i + 1).map((wk) => (
                <option key={wk} value={String(wk)}>
                  Week {wk}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Fixture Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
            >
              <option value="">All Statuses</option>
              <option value="UPCOMING">UPCOMING (Future Dates)</option>
              <option value="RESULT_PENDING">RESULT PENDING (Past Unconfirmed)</option>
              <option value="LIVE">LIVE</option>
              <option value="FT">FT (Completed)</option>
              <option value="BYE">BYE (Scheduling Slots)</option>
              <option value="POSTPONED">POSTPONED</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Club / Venue Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Kano Pillars Jnr, Jos..."
                className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-xs text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TBC Info Callout when filtering TBC or North Central */}
      {onlyTbc && (
        <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 flex items-start gap-3 text-xs text-amber-950">
          <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">
              North Central Zone Weeks 16–18 (M/NO 61–72) — Kickoff Time Marked TBC
            </p>
            <p className="text-amber-900 mt-0.5">
              On official reference sheet <code>IMG-20261103-WA0045.jpg</code>, the right-edge TIME
              column for Weeks 16–18 was physically cropped. In accordance with NLO data integrity
              rules, these 12 fixtures are marked <strong>TBC</strong> until updated by the Super
              Admin.
            </p>
          </div>
        </div>
      )}

      {/* Fixtures List */}
      {loading ? (
        <div className="rounded-xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
          Loading official fixture schedule...
        </div>
      ) : fixtures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fixtures.map((fx) => (
            <MatchCard key={fx.id} fixture={fx} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-slate-200 p-10 text-center space-y-2">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900">No Fixtures Found</h3>
          <p className="text-xs text-slate-500">
            Adjust your Zone, Centre, Week, or Status filter to view matches.
          </p>
        </div>
      )}
    </div>
  );
};

