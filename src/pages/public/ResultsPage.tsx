import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type { FixtureView, HistoricalMatchView } from '@nlo-cup/package';
import { useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../services/api.ts';
import { MatchCard, TeamCrest } from '../../components/SharedComponents.tsx';

export const ResultsPage: React.FC = () => {
  const { seasons, selectedSeasonId, setSelectedSeasonId, zones, groups, lastRealtimeTick } =
    useApp();

  const [historicalMatches, setHistoricalMatches] = useState<HistoricalMatchView[]>([]);
  const [liveCompletedMatches, setLiveCompletedMatches] = useState<FixtureView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [parentZoneId, setParentZoneId] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredGroups = parentZoneId
    ? groups.filter((g) => g.parentZoneId === parentZoneId)
    : groups;

  useEffect(() => {
    let active = true;
    const loadResults = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSeasonId) params.set('seasonId', selectedSeasonId);
        if (parentZoneId) params.set('parentZoneId', parentZoneId);
        if (groupId) params.set('groupId', groupId);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());

        const res = await apiRequest<{
          historicalMatches: HistoricalMatchView[];
          liveCompletedMatches: FixtureView[];
        }>(`/api/public/results?${params.toString()}`);

        if (active) {
          setHistoricalMatches(res.historicalMatches);
          setLiveCompletedMatches(res.liveCompletedMatches);
        }
      } catch (err) {
        console.error('Failed to load results:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadResults();
    return () => {
      active = false;
    };
  }, [selectedSeasonId, parentZoneId, groupId, searchQuery, lastRealtimeTick]);

  const totalConfirmed = historicalMatches.length + liveCompletedMatches.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-nlo-navy text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-emerald-500">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified Full-Time Match Archive
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Official Match Results & Historical Archive
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Displays only confirmed Full-Time (<code className="text-emerald-300">FT</code>) matches
            from live referee officiating and the Super Admin Historical Match Entry Studio.
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-right shrink-0">
          <span className="text-[11px] uppercase text-slate-400 block">Verified FT Results</span>
          <strong className="text-2xl font-mono text-emerald-400">{totalConfirmed}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            Filter Verified Results
          </span>
          <button
            type="button"
            onClick={() => {
              setParentZoneId('');
              setGroupId('');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Search Team or Venue
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

      {/* Results Content */}
      {loading ? (
        <div className="rounded-xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
          Loading verified match results...
        </div>
      ) : totalConfirmed > 0 ? (
        <div className="space-y-8">
          {liveCompletedMatches.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                Completed Live Officiated Matches ({liveCompletedMatches.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveCompletedMatches.map((fx) => (
                  <MatchCard key={fx.id} fixture={fx} />
                ))}
              </div>
            </section>
          )}

          {historicalMatches.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                Official Historical & Secretariat-Confirmed Results ({historicalMatches.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historicalMatches.map((hm) => (
                  <div
                    key={hm.id}
                    className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-nlo-navy text-white">
                            {hm.groupName}
                          </span>
                          <span className="text-xs text-slate-500 truncate">
                            {hm.weekNumber ? `Wk ${hm.weekNumber}` : ''}{' '}
                            {hm.matchNumber ? `(M/NO ${hm.matchNumber})` : ''}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-white">
                          FT
                        </span>
                      </div>

                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 my-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <TeamCrest
                            name={hm.homeTeamName}
                            logoUrl={hm.homeTeamLogoUrl}
                            hasOfficialLogo={hm.homeTeamHasOfficialLogo}
                            size="md"
                          />
                          <span className="font-bold text-sm text-slate-900 leading-tight">
                            {hm.homeTeamName}
                          </span>
                        </div>

                        <div className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-mono font-extrabold text-lg text-center min-w-[76px]">
                          {hm.homeScore} : {hm.awayScore}
                        </div>

                        <div className="flex items-center justify-end gap-2.5 min-w-0 text-right">
                          <span className="font-bold text-sm text-slate-900 leading-tight">
                            {hm.awayTeamName}
                          </span>
                          <TeamCrest
                            name={hm.awayTeamName}
                            logoUrl={hm.awayTeamLogoUrl}
                            hasOfficialLogo={hm.awayTeamHasOfficialLogo}
                            size="md"
                          />
                        </div>
                      </div>

                      {hm.goalscorersSummary && (
                        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mt-2">
                          <strong>Goals:</strong> {hm.goalscorersSummary}
                        </p>
                      )}
                      {hm.notes && (
                        <p className="text-xs text-slate-600 mt-1.5 italic">{hm.notes}</p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        {hm.venueName || 'Official Venue'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {hm.matchDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Past Fixtures Are Marked RESULT PENDING Until Official Score Confirmation
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            In strict compliance with NLO data integrity standards, no match scores are ever
            fabricated. The 55 past-dated fixtures from October and early November 2026 remain
            separated with status <strong>RESULT PENDING</strong> until confirmed in the Super Admin{' '}
            <strong>Historical Match Entry Studio</strong> or finalized by an approved match
            referee.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              to="/fixtures?status=RESULT_PENDING"
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm"
            >
              Inspect 55 RESULT PENDING Fixtures
            </Link>
            <Link
              to="/admin"
              className="px-4 py-2.5 rounded-xl bg-nlo-navy hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Open Admin Historical Match Entry Studio
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

