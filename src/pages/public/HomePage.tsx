import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Globe2,
  MapPin,
  Radio,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import {
  NFF_OFFICIAL_CREST_URL,
  NLO_OFFICIAL_LOGO_URL,
  type FixtureView,
  type HistoricalMatchView,
  type StandingRow,
} from '@nlo-cup/package';
import { useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../services/api.ts';
import {
  MatchCard,
  StandingsTable,
  TeamCrest,
} from '../../components/SharedComponents.tsx';

interface OverviewResponse {
  seasonId: string;
  statistics: {
    totalTeams: number;
    totalParentZones: number;
    totalGroups: number;
    totalVenues: number;
    playableFixtures: number;
    byeEntries: number;
    liveMatches: number;
    upcomingMatches: number;
    resultPendingMatches: number;
    completedMatches: number;
    totalGoals: number;
  };
  liveMatches: FixtureView[];
  upcomingFixtures: FixtureView[];
  resultPendingFixtures: FixtureView[];
  recentCompletedMatches: FixtureView[];
  recentHistoricalResults: HistoricalMatchView[];
  latestMatchUpdates: {
    id: string;
    matchId: string;
    eventType: string;
    playerName: string;
    matchMinute: number;
    teamName: string;
    homeTeamName: string;
    awayTeamName: string;
    homeScore: number;
    awayScore: number;
    groupName: string;
    createdAt: string;
  }[];
  standingsPreview: StandingRow[];
  featuredTeams: {
    id: string;
    name: string;
    shortName: string;
    slug: string;
    logoUrl: string | null;
    hasOfficialLogo: boolean;
    parentZoneId: string;
    parentZoneName: string;
    groupId: string;
    groupName: string;
    groupCode: string;
    homeVenueName: string | null;
  }[];
}

export const HomePage: React.FC = () => {
  const { selectedSeasonId, zones, groups, lastRealtimeTick } = useApp();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPreviewGroupId, setSelectedPreviewGroupId] = useState<string>('');

  useEffect(() => {
    let active = true;
    const loadOverview = async () => {
      try {
        const res = await apiRequest<OverviewResponse>(
          `/api/public/overview${selectedSeasonId ? `?seasonId=${encodeURIComponent(selectedSeasonId)}` : ''}`
        );
        if (!active) return;
        setOverview(res);
        if (!selectedPreviewGroupId && res.standingsPreview.length > 0) {
          setSelectedPreviewGroupId(res.standingsPreview[0].groupId);
        }
      } catch (err) {
        console.error('Failed to fetch homepage overview:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadOverview();
    return () => {
      active = false;
    };
  }, [selectedSeasonId, lastRealtimeTick]);

  const stats = overview?.statistics;
  const activeStandingsRows = (overview?.standingsPreview || []).filter(
    (r) => !selectedPreviewGroupId || r.groupId === selectedPreviewGroupId
  );

  return (
    <div className="space-y-10 pb-14">
      {/* Broadcast Hero Header */}
      <section className="relative bg-gradient-to-br from-nlo-navy via-[#0F2442] to-[#081A2E] text-white overflow-hidden border-b-4 border-emerald-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Official NLO Cup 2026/2027 Competition Hub • Africa/Lagos (WAT)
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                NATIONWIDE LEAGUE ONE{' '}
                <span className="text-emerald-400 block sm:inline">NLO CUP LIVE</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Follow live match scoreboards, official fixtures, verified match results, and
                real-time standings across all 4 Geopolitical Zones, 7 Official Centres, and 46
                participating clubs of the Nationwide League One Cup.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/live"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-900/40 transition-all"
                >
                  <Flame className="w-4 h-4" />
                  Live Scoreboard ({stats?.liveMatches ?? 0})
                </Link>
                <Link
                  to="/fixtures"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  All 252 Official Fixtures
                </Link>
                <Link
                  to="/standings"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 transition-all"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Group Standings
                </Link>
              </div>
            </div>

            {/* Official Crest & Quick Competition Counter Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-slate-900/80 border border-slate-700/80 p-5 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={NLO_OFFICIAL_LOGO_URL}
                      alt="NLO Logo"
                      className="w-12 h-12 rounded-lg bg-white p-1 object-contain"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        NLO Secretariat Verified
                      </p>
                      <h2 className="text-base font-extrabold text-white">
                        2026/2027 Season Snapshot
                      </h2>
                    </div>
                  </div>
                  <img
                    src={NFF_OFFICIAL_CREST_URL}
                    alt="NFA/NFF Crest"
                    className="w-11 h-11 rounded-full bg-white p-0.5 object-contain"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
                    <p className="text-2xl font-mono font-extrabold text-white">
                      {stats?.totalTeams ?? 46}
                    </p>
                    <p className="text-[11px] font-semibold uppercase text-slate-400 mt-0.5">
                      Official Teams
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
                    <p className="text-2xl font-mono font-extrabold text-emerald-400">
                      {stats?.totalGroups ?? 7}
                    </p>
                    <p className="text-[11px] font-semibold uppercase text-slate-400 mt-0.5">
                      Centres / Groups
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
                    <p className="text-2xl font-mono font-extrabold text-white">
                      {stats?.playableFixtures ?? 252}
                    </p>
                    <p className="text-[11px] font-semibold uppercase text-slate-400 mt-0.5">
                      Playable Matches
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
                    <p className="text-2xl font-mono font-extrabold text-rose-400">
                      {stats?.liveMatches ?? 0}
                    </p>
                    <p className="text-[11px] font-semibold uppercase text-slate-400 mt-0.5">
                      Live Now
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
                    <p className="text-2xl font-mono font-extrabold text-amber-300">
                      {stats?.resultPendingMatches ?? 55}
                    </p>
                    <p className="text-[11px] font-semibold uppercase text-slate-400 mt-0.5">
                      Result Pending
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
                    <p className="text-2xl font-mono font-extrabold text-sky-400">
                      {stats?.upcomingMatches ?? 197}
                    </p>
                    <p className="text-[11px] font-semibold uppercase text-slate-400 mt-0.5">
                      Upcoming
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 1. Featured Live Matches Section */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse-live" />
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Featured Live Matches
              </h2>
            </div>
            <Link
              to="/live"
              className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800"
            >
              Open Full Live Scoreboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {overview?.liveMatches && overview.liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overview.liveMatches.map((m) => (
                <MatchCard key={m.id} fixture={m} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    No Matches Currently In-Play Right This Minute
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    As soon as an approved NLO Cup match referee starts a match clock in any of the
                    7 Centres, live scores and events appear here automatically without refreshing.
                  </p>
                </div>
              </div>
              <Link
                to="/fixtures"
                className="px-4 py-2 rounded-lg bg-nlo-navy text-white text-xs font-bold hover:bg-slate-800 shrink-0"
              >
                Browse Match Schedule
              </Link>
            </div>
          )}
        </section>

        {/* 2. Two-Column Layout: Upcoming Fixtures + Latest Match Updates & Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 8 Cols: Upcoming Fixtures & Past Fixtures Pending Official Result */}
          <div className="lg:col-span-8 space-y-8">
            {/* Upcoming Matches */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Next Scheduled NLO Cup Fixtures
                  </h2>
                  <p className="text-xs text-slate-500">
                    Upcoming matches across all 7 official Groups/Centres (WAT)
                  </p>
                </div>
                <Link
                  to="/fixtures?status=UPCOMING"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  All {stats?.upcomingMatches ?? 197} Upcoming <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
                  Loading official fixtures...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(overview?.upcomingFixtures || []).slice(0, 6).map((fx) => (
                    <MatchCard key={fx.id} fixture={fx} />
                  ))}
                </div>
              )}
            </section>

            {/* Recent Verified Match Results + Result Pending Past Fixtures */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Recent Match Results & Past Fixtures
                  </h2>
                  <p className="text-xs text-slate-500">
                    Confirmed Full-Time results & past fixtures awaiting official NLO Secretariat
                    score confirmation
                  </p>
                </div>
                <Link
                  to="/results"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  View Results Archive <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {(overview?.recentCompletedMatches?.length || 0) > 0 ||
              (overview?.recentHistoricalResults?.length || 0) > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  {(overview?.recentCompletedMatches || []).slice(0, 4).map((fx) => (
                    <MatchCard key={fx.id} fixture={fx} />
                  ))}
                  {(overview?.recentHistoricalResults || []).slice(0, 4).map((hr) => (
                    <div
                      key={hr.id}
                      className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 pb-2 mb-2 border-b border-slate-100">
                        <span className="font-bold text-nlo-navy">
                          {hr.groupName} {hr.weekNumber ? `• Wk ${hr.weekNumber}` : ''}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white font-bold text-[11px]">
                          FT • VERIFIED
                        </span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 my-2">
                        <div className="flex items-center gap-2">
                          <TeamCrest
                            name={hr.homeTeamName}
                            logoUrl={hr.homeTeamLogoUrl}
                            hasOfficialLogo={hr.homeTeamHasOfficialLogo}
                            size="sm"
                          />
                          <span className="font-bold text-sm text-slate-900">{hr.homeTeamName}</span>
                        </div>
                        <div className="px-3 py-1 rounded bg-slate-900 text-white font-mono font-extrabold text-base">
                          {hr.homeScore} : {hr.awayScore}
                        </div>
                        <div className="flex items-center justify-end gap-2 text-right">
                          <span className="font-bold text-sm text-slate-900">{hr.awayTeamName}</span>
                          <TeamCrest
                            name={hr.awayTeamName}
                            logoUrl={hr.awayTeamLogoUrl}
                            hasOfficialLogo={hr.awayTeamHasOfficialLogo}
                            size="sm"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
                        <span>{hr.venueName || 'Official Venue'}</span>
                        <span>{hr.matchDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Past fixtures awaiting official score entry */}
              <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4 mb-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <h3 className="text-sm font-bold text-amber-950">
                      Past Fixtures Awaiting Official Score Confirmation (
                      {stats?.resultPendingMatches ?? 55})
                    </h3>
                  </div>
                  <Link
                    to="/fixtures?status=RESULT_PENDING"
                    className="text-xs font-bold text-amber-900 underline"
                  >
                    See All {stats?.resultPendingMatches ?? 55}
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(overview?.resultPendingFixtures || []).slice(0, 4).map((fx) => (
                    <MatchCard key={fx.id} fixture={fx} />
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right 4 Cols: Standings Preview & Latest Match Updates Feed */}
          <div className="lg:col-span-4 space-y-8">
            {/* League Standings Preview */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-extrabold text-slate-900">Standings Preview</h2>
                <Link
                  to="/standings"
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Full Tables →
                </Link>
              </div>

              <div className="mb-3">
                <label htmlFor="home-group-select" className="sr-only">
                  Select Competition Group
                </label>
                <select
                  id="home-group-select"
                  value={selectedPreviewGroupId}
                  onChange={(e) => setSelectedPreviewGroupId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.parentZoneName} — {g.name} ({g.code})
                    </option>
                  ))}
                </select>
              </div>

              <StandingsTable
                rows={activeStandingsRows}
                title={
                  groups.find((g) => g.id === selectedPreviewGroupId)?.name || 'Centre Standings'
                }
                subtitle="Official NLO Cup Group Table"
                compact
              />
            </section>

            {/* Latest Match Updates Ticker */}
            <section className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">Latest Match Event Feed</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Real-time</span>
              </div>

              {overview?.latestMatchUpdates && overview.latestMatchUpdates.length > 0 ? (
                <div className="space-y-3">
                  {overview.latestMatchUpdates.map((ev) => (
                    <Link
                      key={ev.id}
                      to={`/matches/${ev.matchId}`}
                      className="block rounded-lg bg-slate-50 hover:bg-emerald-50/50 p-2.5 border border-slate-200/70 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="text-emerald-700">
                          {ev.matchMinute}&apos; • {ev.eventType.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-slate-900">
                          {ev.homeScore} - {ev.awayScore}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 mt-0.5">
                        {ev.playerName} {ev.teamName ? `(${ev.teamName})` : ''}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {ev.homeTeamName} vs {ev.awayTeamName} • {ev.groupName}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Live match timeline events (goals, cards, substitutions) will stream here in real
                  time as referees officiate matches.
                </p>
              )}
            </section>
          </div>
        </div>

        {/* 3. Competition Regions (4 Parent Zones & 7 Official Centres) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Official Competition Regions & Centres
              </h2>
              <p className="text-xs text-slate-500">
                4 Geopolitical Zones and 7 Official Competition Groups/Centres verified from NLO
                Secretariat sheets
              </p>
            </div>
            <Link
              to="/regions"
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              Explore All Regions & Reference Sheets <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-nlo-navy text-white text-[11px] font-bold">
                      {zone.code}
                    </span>
                    <Globe2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900">{zone.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{zone.description}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    {zone.groups.map((grp) => (
                      <Link
                        key={grp.id}
                        to={`/fixtures?groupId=${encodeURIComponent(grp.id)}`}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 text-xs transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">{grp.name}</span>
                          <span className="text-[11px] text-slate-500">
                            {grp.teamsCount ?? 0} Teams • {grp.playableFixturesCount ?? 0} Matches
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Featured Teams Directory Preview */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Participating NLO Cup Clubs ({stats?.totalTeams ?? 46})
              </h2>
              <p className="text-xs text-slate-500">
                Clubs without uploaded official crests use a clearly labeled neutral shield
                placeholder
              </p>
            </div>
            <Link
              to="/teams"
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              View All {stats?.totalTeams ?? 46} Teams <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(overview?.featuredTeams || []).map((team) => (
              <Link
                key={team.id}
                to={`/teams/${team.id}`}
                className="rounded-xl bg-white border border-slate-200 hover:border-emerald-600 p-3.5 flex flex-col items-center text-center shadow-sm transition-all group"
              >
                <TeamCrest
                  name={team.name}
                  logoUrl={team.logoUrl}
                  hasOfficialLogo={team.hasOfficialLogo}
                  size="md"
                />
                <h3 className="font-bold text-xs text-slate-900 mt-2.5 line-clamp-1 group-hover:text-emerald-700">
                  {team.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{team.groupName}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

