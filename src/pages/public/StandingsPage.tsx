import React, { useEffect, useState } from 'react';
import { Filter, Info, Trophy } from 'lucide-react';
import type { StandingRow } from '@nlo-cup/package';
import { useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../services/api.ts';
import { StandingsTable } from '../../components/SharedComponents.tsx';

export const StandingsPage: React.FC = () => {
  const { seasons, selectedSeasonId, setSelectedSeasonId, zones, groups, lastRealtimeTick } =
    useApp();

  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [parentZoneId, setParentZoneId] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');

  const filteredGroups = parentZoneId
    ? groups.filter((g) => g.parentZoneId === parentZoneId)
    : groups;

  useEffect(() => {
    let active = true;
    const loadStandings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSeasonId) params.set('seasonId', selectedSeasonId);
        if (parentZoneId) params.set('parentZoneId', parentZoneId);
        if (groupId) params.set('groupId', groupId);

        const res = await apiRequest<{ standings: StandingRow[] }>(
          `/api/public/standings?${params.toString()}`
        );
        if (active) {
          setStandings(res.standings);
        }
      } catch (err) {
        console.error('Failed to load standings:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadStandings();
    return () => {
      active = false;
    };
  }, [selectedSeasonId, parentZoneId, groupId, lastRealtimeTick]);

  // Group standings by groupId
  const groupedTables = filteredGroups
    .filter((g) => !groupId || g.id === groupId)
    .map((grp) => ({
      group: grp,
      rows: standings.filter((s) => s.groupId === grp.id),
    }));

  const currentSeason = seasons.find((s) => s.id === selectedSeasonId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-nlo-navy text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-emerald-500">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Real-Time Competition Tables
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Official NLO Cup Group Standings
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Automatically recalculated upon every confirmed Full-Time (<code className="text-emerald-300">FT</code>) result across all 7 Official Groups & Centres.
          </p>
        </div>

        <div className="rounded-xl bg-slate-800/90 border border-slate-700 px-4 py-2.5 text-xs">
          <span className="text-slate-400 block text-[10px] uppercase">Scoring System</span>
          <strong className="text-white">
            Win: {currentSeason?.pointsPerWin ?? 3} pts • Draw: {currentSeason?.pointsPerDraw ?? 1}{' '}
            pt • Loss: {currentSeason?.pointsPerLoss ?? 0} pts
          </strong>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm flex flex-wrap items-end justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
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
              <option value="">All 4 Geopolitical Zones</option>
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
              <option value="">All 7 Official Centres</option>
              {filteredGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setParentZoneId('');
            setGroupId('');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
        >
          <Filter className="w-3.5 h-3.5" />
          Show All 7 Tables
        </button>
      </div>

      {/* Standings Tables */}
      {loading ? (
        <div className="rounded-xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
          Loading official standings tables...
        </div>
      ) : (
        <div className="space-y-8">
          {groupedTables.map(({ group, rows }) => (
            <StandingsTable
              key={group.id}
              rows={rows}
              title={`${group.name} (${group.code})`}
              subtitle={`Parent Zone: ${group.parentZoneName} • Format: ${group.format}${
                group.hasByeSlot ? ' • Includes 5 Clubs + 1 Weekly BYE Slot (Non-Scoring)' : ''
              }`}
            />
          ))}
        </div>
      )}

      {/* Tie-Breaker & BYE Rules Legend */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <Info className="w-4 h-4 text-emerald-700" />
          Official NLO Cup Standings & Tie-Breaker Rules
        </div>
        <p>
          <strong>Tie-Breaker Order:</strong>{' '}
          {(
            currentSeason?.tieBreakerRules || [
              'POINTS',
              'GOAL_DIFFERENCE',
              'GOALS_FOR',
              'HEAD_TO_HEAD',
              'WINS',
            ]
          ).join(' → ')}{' '}
          → Alphabetical Club Name.
        </p>
        <p>
          <strong>Scheduled BYE Policy:</strong> The 10 scheduled weekly BYE slots in{' '}
          <strong>North West Zone Group B</strong> (Team 6 = BYE) are non-playable scheduling
          entries (`is_bye = TRUE`) and never add matches played, goals, or points to any club.
        </p>
      </div>
    </div>
  );
};

