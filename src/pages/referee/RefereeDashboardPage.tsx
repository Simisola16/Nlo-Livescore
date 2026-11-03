import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Globe2,
  Lock,
  LogOut,
  MapPin,
  Play,
  Radio,
  Search,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import type { FixtureView } from '@nlo-cup/package';
import { useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../services/api.ts';
import { MatchStatusBadge, TeamCrest } from '../../components/SharedComponents.tsx';

interface RefereeDashboardPayload {
  refereeId: string;
  refereeIdNumber: string;
  allowedGroupIds: string[];
  matches: FixtureView[];
  currentlyOfficiatedMatches: FixtureView[];
  assignedMatches: FixtureView[];
  availableMatches: FixtureView[];
  upcomingMatches: FixtureView[];
  completedMatches: FixtureView[];
  myMatchHistory: FixtureView[];
}

export const RefereeDashboardPage: React.FC = () => {
  const { user, referee, authLoading, logout, lastRealtimeTick, refreshSession } = useApp();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<RefereeDashboardPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    'AVAILABLE' | 'OFFICIATING' | 'ASSIGNED' | 'UPCOMING' | 'COMPLETED' | 'HISTORY'
  >('AVAILABLE');

  const [homeTeamSearch, setHomeTeamSearch] = useState<string>('');
  const [awayTeamSearch, setAwayTeamSearch] = useState<string>('');
  const [matchDateFilter, setMatchDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/referee/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user || user.role !== 'REFEREE' || user.status !== 'APPROVED') {
      setLoading(false);
      return;
    }

    let active = true;
    const loadRefereeDashboard = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (homeTeamSearch.trim()) params.set('homeTeam', homeTeamSearch.trim());
        if (awayTeamSearch.trim()) params.set('awayTeam', awayTeamSearch.trim());
        if (matchDateFilter) params.set('matchDate', matchDateFilter);
        if (statusFilter) params.set('status', statusFilter);

        const res = await apiRequest<RefereeDashboardPayload>(
          `/api/referee/dashboard?${params.toString()}`
        );
        if (active) {
          setDashboard(res);
        }
      } catch (err: any) {
        console.error('Referee dashboard error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadRefereeDashboard();
    return () => {
      active = false;
    };
  }, [
    user,
    homeTeamSearch,
    awayTeamSearch,
    matchDateFilter,
    statusFilter,
    lastRealtimeTick,
  ]);

  const handleClaimAndOpenMatch = async (fx: FixtureView) => {
    setActionError('');
    const targetId = fx.matchId || fx.id;
    setClaimingId(targetId);
    try {
      await apiRequest(`/api/referee/matches/${encodeURIComponent(targetId)}/claim`, {
        method: 'POST',
      });
      navigate(`/referee/matches/${targetId}`);
    } catch (err: any) {
      setActionError(err.message || 'Could not claim match control.');
    } finally {
      setClaimingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        Verifying referee credentials...
      </div>
    );
  }

  if (!user) return null;

  // Non-Approved Referee Account Verification Screen (PENDING / SUSPENDED / REJECTED)
  if (user.status !== 'APPROVED') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
          <div
            className={`p-6 text-white ${
              user.status === 'PENDING'
                ? 'bg-amber-600'
                : user.status === 'SUSPENDED'
                  ? 'bg-rose-700'
                  : 'bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-xs font-bold uppercase tracking-wider">
                Account Status: {user.status}
              </span>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1 text-xs font-bold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
            <h1 className="text-2xl font-extrabold mt-3">
              {user.status === 'PENDING'
                ? 'Your Referee Account Is Pending Super Admin Approval'
                : user.status === 'SUSPENDED'
                  ? 'Your Referee Account Has Been Suspended'
                  : 'Your Referee Application Was Not Approved'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1">
              {user.status === 'PENDING'
                ? 'Only approved referees can access the Live Match Scoring Control Centre. Once the NLO Secretariat Super Admin approves your application, your match dashboard will unlock automatically.'
                : 'Suspended or rejected referee accounts are blocked from officiating matches or submitting live score updates.'}
            </p>
          </div>

          <div className="p-6 space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">Full Name</span>
                <strong className="text-slate-900">{user.fullName}</strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Referee ID Number</span>
                <strong className="font-mono text-slate-900">
                  {referee?.refereeIdNumber || 'N/A'}
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Registered Group / Centre</span>
                <strong className="text-emerald-800">
                  {referee?.primaryGroupName} ({referee?.primaryGroupCode})
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Parent Geopolitical Zone</span>
                <strong className="text-slate-900">{referee?.parentZoneName}</strong>
              </div>
            </div>

            {referee?.rejectionReason && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-rose-900">
                <strong>Administrator Note:</strong> {referee.rejectionReason}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={refreshSession}
                className="px-4 py-2.5 rounded-xl bg-nlo-navy hover:bg-slate-800 text-white text-xs font-bold"
              >
                Check Approval Status Now
              </button>
              <Link to="/" className="text-xs font-bold text-emerald-700 hover:underline">
                Return to Public Scoreboard →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabMatches: FixtureView[] = (() => {
    if (!dashboard) return [];
    switch (activeTab) {
      case 'OFFICIATING':
        return dashboard.currentlyOfficiatedMatches;
      case 'ASSIGNED':
        return dashboard.assignedMatches;
      case 'AVAILABLE':
        return dashboard.availableMatches;
      case 'UPCOMING':
        return dashboard.upcomingMatches;
      case 'COMPLETED':
        return dashboard.completedMatches;
      case 'HISTORY':
        return dashboard.myMatchHistory;
      default:
        return dashboard.availableMatches;
    }
  })();

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Mobile-First Referee Profile & Region Header */}
      <div className="rounded-2xl bg-nlo-navy text-white p-5 sm:p-6 border-b-4 border-emerald-500 shadow-lg space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {referee?.photoUrl ? (
              <img
                src={referee.photoUrl}
                alt={user.fullName}
                className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-400"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center font-extrabold text-xl">
                {user.fullName.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase">
                  APPROVED REFEREE
                </span>
                <span className="font-mono text-xs text-emerald-300 font-bold">
                  {referee?.refereeIdNumber}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold mt-0.5">
                Welcome, {user.fullName}
              </h1>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                Approved Region:{' '}
                <strong className="text-white">
                  {referee?.allowedGroupNames?.join(', ') || referee?.primaryGroupName}
                </strong>{' '}
                ({referee?.parentZoneName})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Quick Counters */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center pt-2">
          {[
            {
              id: 'AVAILABLE',
              label: 'Available',
              count: dashboard?.availableMatches.length ?? 0,
              color: 'text-emerald-400',
            },
            {
              id: 'OFFICIATING',
              label: 'Officiating',
              count: dashboard?.currentlyOfficiatedMatches.length ?? 0,
              color: 'text-rose-400',
            },
            {
              id: 'ASSIGNED',
              label: 'Assigned',
              count: dashboard?.assignedMatches.length ?? 0,
              color: 'text-amber-300',
            },
            {
              id: 'UPCOMING',
              label: 'Upcoming',
              count: dashboard?.upcomingMatches.length ?? 0,
              color: 'text-sky-300',
            },
            {
              id: 'COMPLETED',
              label: 'Completed',
              count: dashboard?.completedMatches.length ?? 0,
              color: 'text-white',
            },
            {
              id: 'HISTORY',
              label: 'My History',
              count: dashboard?.myMatchHistory.length ?? 0,
              color: 'text-emerald-300',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-xl p-2.5 border transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600/30 border-emerald-400 shadow'
                  : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <strong className={`text-lg font-mono block ${tab.color}`}>{tab.count}</strong>
              <span className="text-[10px] uppercase font-bold text-slate-300">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-2.5 text-xs text-rose-900">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Search Bar (Home Team, Away Team, Match Date, Match Status) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-emerald-700" />
            Search Matches in Your Approved Group/Centre
          </span>
          <button
            type="button"
            onClick={() => {
              setHomeTeamSearch('');
              setAwayTeamSearch('');
              setMatchDateFilter('');
              setStatusFilter('');
            }}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Clear Search
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Home Team</label>
            <input
              type="text"
              value={homeTeamSearch}
              onChange={(e) => setHomeTeamSearch(e.target.value)}
              placeholder="Search Home Club..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Away Team</label>
            <input
              type="text"
              value={awayTeamSearch}
              onChange={(e) => setAwayTeamSearch(e.target.value)}
              placeholder="Search Away Club..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Match Date</label>
            <input
              type="date"
              value={matchDateFilter}
              onChange={(e) => setMatchDateFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Match Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900"
            >
              <option value="">All Statuses</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="RESULT_PENDING">RESULT PENDING</option>
              <option value="LIVE">LIVE</option>
              <option value="HT">HT</option>
              <option value="FT">FT</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="POSTPONED">POSTPONED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matches List for Active Tab */}
      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
          Loading regional matches...
        </div>
      ) : tabMatches.length > 0 ? (
        <div className="space-y-3">
          {tabMatches.map((fx) => {
            const isLockedByMe = fx.lockedByRefereeId === referee?.id;
            const isLockedByOther = Boolean(
              fx.lockedByRefereeId && fx.lockedByRefereeId !== referee?.id
            );
            const targetId = fx.matchId || fx.id;

            return (
              <div
                key={fx.id}
                className={`rounded-2xl bg-white border p-4 shadow-sm transition-all ${
                  isLockedByMe
                    ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-nlo-navy text-white font-bold">
                      {fx.groupName}
                    </span>
                    <span className="font-mono font-bold text-slate-600">
                      Wk {fx.weekNumber} • M/NO {fx.matchNumber}
                    </span>
                  </div>
                  <MatchStatusBadge
                    status={fx.matchStatus || fx.fixtureStatus}
                    minute={fx.currentMinute}
                    stoppage={fx.stoppageTimeAdded}
                    isKickoffTbc={fx.isKickoffTbc}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-4">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      <TeamCrest
                        name={fx.homeTeamName}
                        logoUrl={fx.homeTeamLogoUrl}
                        hasOfficialLogo={fx.homeTeamHasOfficialLogo}
                        size="md"
                      />
                      <span className="font-extrabold text-sm sm:text-base text-slate-900">
                        {fx.homeTeamName}
                      </span>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-mono font-extrabold text-base text-center min-w-[74px]">
                      {fx.homeScore ?? 0} : {fx.awayScore ?? 0}
                    </div>

                    <div className="flex items-center justify-end gap-2.5 text-right">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900">
                        {fx.awayTeamName}
                      </span>
                      <TeamCrest
                        name={fx.awayTeamName}
                        logoUrl={fx.awayTeamLogoUrl}
                        hasOfficialLogo={fx.awayTeamHasOfficialLogo}
                        size="md"
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex flex-col sm:items-end gap-1.5">
                    {isLockedByOther ? (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        Locked by {fx.lockedByRefereeName}
                      </div>
                    ) : fx.matchStatus === 'FT' ? (
                      <Link
                        to={`/matches/${targetId}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        View Completed Report
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={claimingId === targetId}
                        onClick={() => handleClaimAndOpenMatch(fx)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md transition-all"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        {claimingId === targetId
                          ? 'Locking Match...'
                          : isLockedByMe
                            ? 'Resume Live Control Centre'
                            : 'Officiate & Open Live Control'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    {fx.venueName || 'Venue TBC'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>{fx.matchDate}</span>
                    <span>
                      {fx.isKickoffTbc ? (
                        <strong className="text-amber-700">Kickoff TBC</strong>
                      ) : (
                        `${fx.kickoffTime} WAT`
                      )}
                    </span>
                    {isLockedByMe && (
                      <span className="text-emerald-700 font-bold">
                        • Locked Under Your Control
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-2">
          <Radio className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900">No Matches in This Category</h3>
          <p className="text-xs text-slate-500">
            Switch tabs above or clear your search filters to view eligible matches in{' '}
            {referee?.primaryGroupName}.
          </p>
        </div>
      )}
    </div>
  );
};

