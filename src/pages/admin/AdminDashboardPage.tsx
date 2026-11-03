import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileImage,
  Globe2,
  History,
  Lock,
  LogOut,
  Plus,
  Radio,
  ShieldCheck,
  Trophy,
  Unlock,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import type {
  AuditLogEntry,
  FixtureView,
  HistoricalMatchView,
  RefereeProfile,
  Team,
} from '@nlo-cup/package';
import { useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../services/api.ts';
import { MatchStatusBadge, TeamCrest } from '../../components/SharedComponents.tsx';

type AdminTab =
  | 'OVERVIEW'
  | 'HISTORICAL'
  | 'REFEREES'
  | 'FIXTURES'
  | 'TEAMS'
  | 'REGIONS'
  | 'LIVE_LOCKS'
  | 'MEDIA'
  | 'SEASONS_AUDIT';

export const AdminDashboardPage: React.FC = () => {
  const {
    user,
    authLoading,
    logout,
    seasons,
    selectedSeasonId,
    zones,
    groups,
    refreshMetadata,
    lastRealtimeTick,
  } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [overview, setOverview] = useState<any | null>(null);
  const [referees, setReferees] = useState<RefereeProfile[]>([]);
  const [fixtures, setFixtures] = useState<FixtureView[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [historicalMatches, setHistoricalMatches] = useState<HistoricalMatchView[]>([]);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [bannerMsg, setBannerMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  // Filters
  const [fixtureStatusFilter, setFixtureStatusFilter] = useState<string>('');
  const [fixtureOnlyTbc, setFixtureOnlyTbc] = useState<boolean>(false);
  const [fixtureGroupFilter, setFixtureGroupFilter] = useState<string>('');

  // Historical Match Entry Studio Form State
  const [histMode, setHistMode] = useState<'CONFIRM_PENDING' | 'STANDALONE'>('CONFIRM_PENDING');
  const [selectedPendingFixtureId, setSelectedPendingFixtureId] = useState<string>('');
  const [histGroupId, setHistGroupId] = useState<string>('');
  const [histHomeTeamId, setHistHomeTeamId] = useState<string>('');
  const [histAwayTeamId, setHistAwayTeamId] = useState<string>('');
  const [histHomeScore, setHistHomeScore] = useState<string>('0');
  const [histAwayScore, setHistAwayScore] = useState<string>('0');
  const [histDate, setHistDate] = useState<string>('2026-10-25');
  const [histKickoff, setHistKickoff] = useState<string>('4:00 PM');
  const [histVenueName, setHistVenueName] = useState<string>('');
  const [histGoalscorers, setHistGoalscorers] = useState<string>('');
  const [histNotes, setHistNotes] = useState<string>('');

  // Fixture Edit Modal State (TBC Kickoff Time & Status Resolution)
  const [editingFixture, setEditingFixture] = useState<FixtureView | null>(null);
  const [editFixtureKickoff, setEditFixtureKickoff] = useState<string>('');
  const [editFixtureDate, setEditFixtureDate] = useState<string>('');
  const [editFixtureVenue, setEditFixtureVenue] = useState<string>('');
  const [editFixtureStatus, setEditFixtureStatus] = useState<string>('UPCOMING');

  // Media Upload Form State (Code-Free Logos, Photos, Videos)
  const [mediaCategory, setMediaCategory] = useState<string>('TEAM_LOGO');
  const [mediaEntityId, setMediaEntityId] = useState<string>('');
  const [mediaTitle, setMediaTitle] = useState<string>('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamGroupId, setNewTeamGroupId] = useState<string>('');
  const [newTeamCoach, setNewTeamCoach] = useState<string>('');

  // New Season Form State
  const [newSeasonName, setNewSeasonName] = useState<string>('');
  const [newSeasonStart, setNewSeasonStart] = useState<string>('2027-10-01');
  const [newSeasonEnd, setNewSeasonEnd] = useState<string>('2028-05-30');

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
        navigate('/admin/login');
      }
    }
  }, [authLoading, user, navigate]);

  const loadAdminOverview = async () => {
    try {
      const res = await apiRequest('/api/admin/overview');
      setOverview(res);
    } catch (err) {
      console.error('Admin overview failed:', err);
    }
  };

  const loadReferees = async () => {
    try {
      const res = await apiRequest<{ referees: RefereeProfile[] }>('/api/admin/referees');
      setReferees(res.referees);
    } catch (err) {
      console.error('Load referees failed:', err);
    }
  };

  const loadFixtures = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSeasonId) params.set('seasonId', selectedSeasonId);
      if (fixtureGroupFilter) params.set('groupId', fixtureGroupFilter);
      if (fixtureStatusFilter) params.set('status', fixtureStatusFilter);
      if (fixtureOnlyTbc) params.set('isKickoffTbc', 'true');
      const res = await apiRequest<{ fixtures: FixtureView[] }>(
        `/api/public/fixtures?${params.toString()}`
      );
      setFixtures(res.fixtures);
    } catch (err) {
      console.error('Load fixtures failed:', err);
    }
  };

  const loadTeams = async () => {
    try {
      const res = await apiRequest<{ teams: Team[] }>('/api/public/teams');
      setTeams(res.teams);
      if (!mediaEntityId && res.teams.length > 0) {
        setMediaEntityId(res.teams[0].id);
      }
    } catch (err) {
      console.error('Load teams failed:', err);
    }
  };

  const loadHistorical = async () => {
    try {
      const res = await apiRequest<{ historicalMatches: HistoricalMatchView[] }>(
        '/api/admin/historical-matches'
      );
      setHistoricalMatches(res.historicalMatches);
    } catch (err) {
      console.error('Load historical matches failed:', err);
    }
  };

  const loadMediaAndAudit = async () => {
    try {
      const [mRes, aRes] = await Promise.all([
        apiRequest<{ mediaAssets: any[] }>('/api/admin/media'),
        apiRequest<{ auditLogs: AuditLogEntry[] }>('/api/admin/audit-logs'),
      ]);
      setMediaAssets(mRes.mediaAssets);
      setAuditLogs(aRes.auditLogs);
    } catch (err) {
      console.error('Load media/audit failed:', err);
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) return;
    loadAdminOverview();
    loadReferees();
    loadFixtures();
    loadTeams();
    loadHistorical();
    loadMediaAndAudit();
  }, [
    user,
    selectedSeasonId,
    fixtureGroupFilter,
    fixtureStatusFilter,
    fixtureOnlyTbc,
    lastRealtimeTick,
  ]);

  const resultPendingFixtures = fixtures.filter((f) => f.fixtureStatus === 'RESULT_PENDING');

  useEffect(() => {
    if (!selectedPendingFixtureId && resultPendingFixtures.length > 0) {
      const first = resultPendingFixtures[0];
      setSelectedPendingFixtureId(first.id);
      setHistVenueName(first.venueName || '');
      setHistDate(first.matchDate || '2026-10-25');
      setHistKickoff(first.kickoffTime || '4:00 PM');
    }
  }, [resultPendingFixtures.length]);

  const handleRefereeDecision = async (
    refId: string,
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING',
    primaryGroupId?: string
  ) => {
    setBusy(true);
    setErrorMsg('');
    setBannerMsg('');
    try {
      await apiRequest(`/api/admin/referees/${encodeURIComponent(refId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          primaryGroupId,
          reason: `Updated to ${status} by Super Admin`,
        }),
      });
      setBannerMsg(`Referee status updated to ${status}.`);
      await Promise.all([loadReferees(), loadAdminOverview()]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update referee.');
    } finally {
      setBusy(false);
    }
  };

  const handlePublishHistoricalMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg('');
    setBannerMsg('');
    try {
      if (histMode === 'CONFIRM_PENDING') {
        const fx = fixtures.find((f) => f.id === selectedPendingFixtureId);
        if (!fx) {
          throw new Error('Please select a RESULT_PENDING fixture to confirm.');
        }
        await apiRequest('/api/admin/historical-matches', {
          method: 'POST',
          body: JSON.stringify({
            seasonId: fx.seasonId,
            groupId: fx.groupId,
            linkedFixtureId: fx.id,
            weekNumber: fx.weekNumber,
            matchNumber: fx.matchNumber,
            homeTeamId: fx.homeTeamId,
            awayTeamId: fx.awayTeamId,
            homeScore: Number(histHomeScore),
            awayScore: Number(histAwayScore),
            matchDate: histDate || fx.matchDate,
            kickoffTime: histKickoff || fx.kickoffTime || '16:00',
            venueName: histVenueName || fx.venueName || 'Official Venue',
            additionalInfo:
              [histGoalscorers.trim() ? `Goals: ${histGoalscorers.trim()}` : '', histNotes.trim()]
                .filter(Boolean)
                .join(' | ') || null,
          }),
        });
        setBannerMsg(
          `Confirmed official FT result for ${fx.homeTeamName} ${histHomeScore}-${histAwayScore} ${fx.awayTeamName}! Standings table automatically updated.`
        );
      } else {
        await apiRequest('/api/admin/historical-matches', {
          method: 'POST',
          body: JSON.stringify({
            seasonId: selectedSeasonId,
            groupId: histGroupId || groups[0]?.id,
            homeTeamId: histHomeTeamId,
            awayTeamId: histAwayTeamId,
            homeScore: Number(histHomeScore),
            awayScore: Number(histAwayScore),
            matchDate: histDate,
            kickoffTime: histKickoff || '16:00',
            venueName: histVenueName.trim() || 'Official Venue',
            additionalInfo:
              [histGoalscorers.trim() ? `Goals: ${histGoalscorers.trim()}` : '', histNotes.trim()]
                .filter(Boolean)
                .join(' | ') || null,
          }),
        });
        setBannerMsg('Standalone historical match published and standings recalculated!');
      }

      setHistHomeScore('0');
      setHistAwayScore('0');
      setHistGoalscorers('');
      setHistNotes('');
      await Promise.all([loadFixtures(), loadHistorical(), loadAdminOverview()]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save historical match result.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveFixtureUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFixture) return;
    setBusy(true);
    setErrorMsg('');
    setBannerMsg('');
    try {
      await apiRequest(`/api/admin/fixtures/${encodeURIComponent(editingFixture.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          kickoffTime: editFixtureKickoff.trim() || 'TBC',
          matchDate: editFixtureDate || editingFixture.matchDate,
          venueName: editFixtureVenue.trim() || editingFixture.venueName,
          fixtureStatus: editFixtureStatus,
        }),
      });
      setBannerMsg(
        `Updated fixture M/NO ${editingFixture.matchNumber} (${editingFixture.homeTeamName} vs ${editingFixture.awayTeamName}).`
      );
      setEditingFixture(null);
      await Promise.all([loadFixtures(), loadAdminOverview()]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update fixture.');
    } finally {
      setBusy(false);
    }
  };

  const handleUploadMediaAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile) {
      setErrorMsg('Please select an image or video file to upload.');
      return;
    }
    setBusy(true);
    setErrorMsg('');
    setBannerMsg('');
    try {
      const formData = new FormData();
      formData.append('category', mediaCategory);
      formData.append(
        'entityType',
        mediaCategory.startsWith('TEAM_') || mediaCategory === 'PROMOTIONAL_VIDEO'
          ? 'TEAM'
          : 'COMPETITION'
      );
      if (mediaEntityId) formData.append('entityId', mediaEntityId);
      formData.append('title', mediaTitle.trim() || mediaFile.name);
      formData.append('file', mediaFile);

      await apiRequest('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      setBannerMsg(
        'Media asset uploaded and automatically bound without requiring source code changes!'
      );
      setMediaFile(null);
      setMediaTitle('');
      await Promise.all([loadTeams(), loadMediaAndAudit(), loadAdminOverview()]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Media upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg('');
    try {
      await apiRequest('/api/admin/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: newTeamName.trim(),
          groupId: newTeamGroupId || groups[0]?.id,
          headCoach: newTeamCoach.trim() || null,
          isActive: true,
        }),
      });
      setBannerMsg(`Created club "${newTeamName.toUpperCase()}" and updated group standings.`);
      setNewTeamName('');
      setNewTeamCoach('');
      await Promise.all([loadTeams(), loadAdminOverview(), refreshMetadata()]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create team.');
    } finally {
      setBusy(false);
    }
  };

  const handleReleaseMatchLock = async (matchId: string) => {
    setBusy(true);
    setErrorMsg('');
    try {
      await apiRequest(`/api/admin/matches/${encodeURIComponent(matchId)}/override-lock`, {
        method: 'POST',
        body: JSON.stringify({
          targetRefereeId: null,
          reason: 'Super Admin manual lock release from Command Centre',
        }),
      });
      setBannerMsg('Match lock released by Super Admin.');
      await Promise.all([loadFixtures(), loadAdminOverview()]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to override lock.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg('');
    try {
      await apiRequest('/api/admin/seasons', {
        method: 'POST',
        body: JSON.stringify({
          name: newSeasonName.trim(),
          startDate: newSeasonStart,
          endDate: newSeasonEnd,
          isActive: false,
          isArchived: false,
        }),
      });
      setBannerMsg(`Season "${newSeasonName}" created successfully.`);
      setNewSeasonName('');
      await refreshMetadata();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create season.');
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        Loading NLO Secretariat Super Admin Command Centre...
      </div>
    );
  }

  const kpis = overview?.kpis || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Command Centre Banner */}
      <div className="rounded-2xl bg-nlo-navy text-white p-6 border-b-4 border-emerald-500 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admin Command Centre • {user.email}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            NLO Cup Competition Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Manage Parent Zones, 7 Official Centres, 46 Clubs, 252 Fixtures, Referees, Media Assets,
            Simultaneous Live Locks, and the Historical Match Entry Studio.
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 self-start md:self-auto"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          Sign Out
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        {[
          { id: 'OVERVIEW', label: 'Overview & KPIs', icon: Activity },
          {
            id: 'HISTORICAL',
            label: `Historical Studio (${kpis.resultPendingMatches ?? 55} Pending)`,
            icon: History,
          },
          {
            id: 'REFEREES',
            label: `Referees (${kpis.pendingReferees ?? 0} Pending)`,
            icon: UserCheck,
          },
          {
            id: 'FIXTURES',
            label: `Fixtures & TBC (${kpis.tbcKickoffFixtures ?? 12} TBC)`,
            icon: Calendar,
          },
          { id: 'TEAMS', label: `Clubs (${kpis.totalTeams ?? 46})`, icon: Users },
          { id: 'REGIONS', label: 'Zones & 7 Centres', icon: Globe2 },
          { id: 'LIVE_LOCKS', label: 'Live Monitor & Locks', icon: Radio },
          { id: 'MEDIA', label: 'Media & Logos', icon: FileImage },
          { id: 'SEASONS_AUDIT', label: 'Seasons & Audit Trail', icon: Trophy },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === tab.id
                  ? 'bg-nlo-navy text-white shadow'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Global Status Alerts */}
      {bannerMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between text-xs font-bold text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bannerMsg}</span>
          </div>
          <button type="button" onClick={() => setBannerMsg('')} className="underline">
            Dismiss
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between text-xs font-bold text-rose-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg('')} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Clubs', val: kpis.totalTeams ?? 46, color: 'text-slate-900' },
              { label: 'Parent Zones', val: kpis.totalZones ?? 4, color: 'text-nlo-navy' },
              { label: 'Centres / Groups', val: kpis.totalGroups ?? 7, color: 'text-emerald-700' },
              { label: 'Official Venues', val: kpis.totalVenues ?? 29, color: 'text-slate-900' },
              { label: 'Live Matches', val: kpis.liveMatches ?? 0, color: 'text-rose-600' },
              {
                label: 'Upcoming Matches',
                val: kpis.upcomingMatches ?? 197,
                color: 'text-sky-700',
              },
              {
                label: 'Result Pending (Past)',
                val: kpis.resultPendingMatches ?? 55,
                color: 'text-amber-700',
              },
              {
                label: 'Confirmed FT Results',
                val: kpis.completedMatches ?? 0,
                color: 'text-emerald-700',
              },
              {
                label: 'TBC Kickoff Times',
                val: kpis.tbcKickoffFixtures ?? 12,
                color: 'text-amber-600',
              },
              {
                label: 'Pending Referees',
                val: kpis.pendingReferees ?? 0,
                color: 'text-amber-700',
              },
              {
                label: 'Approved Referees',
                val: kpis.approvedReferees ?? 0,
                color: 'text-emerald-700',
              },
              { label: 'Media Assets', val: kpis.totalMediaAssets ?? 0, color: 'text-slate-900' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm"
              >
                <span className="text-[11px] font-bold uppercase text-slate-500 block">
                  {item.label}
                </span>
                <strong className={`text-2xl font-mono font-extrabold mt-1 block ${item.color}`}>
                  {item.val}
                </strong>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pending Referee Approvals */}
            <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-base text-slate-900">
                  Pending Referee Applications ({overview?.pendingReferees?.length ?? 0})
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('REFEREES')}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Manage All Referees →
                </button>
              </div>

              {overview?.pendingReferees?.length > 0 ? (
                <div className="space-y-3">
                  {overview.pendingReferees.map((r: any) => (
                    <div
                      key={r.id}
                      className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <strong className="text-slate-900 text-sm block">{r.full_name}</strong>
                        <span className="font-mono text-amber-900 font-bold">
                          ID: {r.referee_id_number}
                        </span>{' '}
                        • <span>{r.primary_group_name}</span> ({r.parent_zone_name})
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRefereeDecision(r.id, 'APPROVED')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRefereeDecision(r.id, 'REJECTED')}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">
                  No referee applications currently awaiting approval.
                </p>
              )}
            </div>

            {/* Recent Audit Activity */}
            <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-base text-slate-900">
                  Recent Platform Audit Log
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('SEASONS_AUDIT')}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Full Audit Trail →
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(overview?.recentActivities || []).slice(0, 10).map((a: AuditLogEntry) => (
                  <div
                    key={a.id}
                    className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-mono font-bold text-nlo-navy">{a.action}</span>
                      <p className="text-[11px] text-slate-500">
                        Actor: {a.actorName || 'System'} ({a.actorRole || 'SYSTEM'}) • Entity:{' '}
                        {a.entityType}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(a.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORICAL MATCH ENTRY STUDIO (Confirm RESULT_PENDING or Add Standalone FT Results) */}
      {activeTab === 'HISTORICAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold uppercase">
                Section 7 & Q2 Studio
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                Historical Match Entry Studio
              </h2>
              <p className="text-xs text-slate-600">
                Confirm official scores for the {resultPendingFixtures.length} past fixtures marked{' '}
                <strong>RESULT_PENDING</strong>, or publish standalone historical results. Confirmed
                results immediately update Group Standings.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHistMode('CONFIRM_PENDING')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold border ${
                  histMode === 'CONFIRM_PENDING'
                    ? 'bg-nlo-navy text-white border-nlo-navy'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Confirm Past Fixture ({resultPendingFixtures.length})
              </button>
              <button
                type="button"
                onClick={() => setHistMode('STANDALONE')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold border ${
                  histMode === 'STANDALONE'
                    ? 'bg-nlo-navy text-white border-nlo-navy'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Standalone Historical Entry
              </button>
            </div>

            <form onSubmit={handlePublishHistoricalMatch} className="space-y-3 text-xs">
              {histMode === 'CONFIRM_PENDING' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Select Past Fixture (Status: RESULT_PENDING) *
                  </label>
                  <select
                    required
                    value={selectedPendingFixtureId}
                    onChange={(e) => {
                      const idVal = e.target.value;
                      setSelectedPendingFixtureId(idVal);
                      const found = resultPendingFixtures.find((x) => x.id === idVal);
                      if (found) {
                        setHistDate(found.matchDate || '2026-10-25');
                        setHistKickoff(found.kickoffTime || '4:00 PM');
                        setHistVenueName(found.venueName || '');
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-semibold text-slate-900"
                  >
                    <option value="">-- Choose a RESULT_PENDING Fixture --</option>
                    {resultPendingFixtures.map((fx) => (
                      <option key={fx.id} value={fx.id}>
                        [{fx.groupCode}] Wk {fx.weekNumber} M#{fx.matchNumber}: {fx.homeTeamName} vs{' '}
                        {fx.awayTeamName} ({fx.matchDate})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Competition Group / Centre *
                    </label>
                    <select
                      required
                      value={histGroupId}
                      onChange={(e) => setHistGroupId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                    >
                      <option value="">-- Select Group/Centre --</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Home Team *</label>
                      <select
                        required
                        value={histHomeTeamId}
                        onChange={(e) => setHistHomeTeamId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      >
                        <option value="">-- Home Club --</option>
                        {teams
                          .filter((t) => !histGroupId || t.groupId === histGroupId)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Away Team *</label>
                      <select
                        required
                        value={histAwayTeamId}
                        onChange={(e) => setHistAwayTeamId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      >
                        <option value="">-- Away Club --</option>
                        {teams
                          .filter((t) => !histGroupId || t.groupId === histGroupId)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Home Final Score (FT) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={99}
                    value={histHomeScore}
                    onChange={(e) => setHistHomeScore(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-extrabold text-base text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Away Final Score (FT) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={99}
                    value={histAwayScore}
                    onChange={(e) => setHistAwayScore(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-extrabold text-base text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Match Date *</label>
                  <input
                    type="date"
                    required
                    value={histDate}
                    onChange={(e) => setHistDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Venue / Stadium</label>
                  <input
                    type="text"
                    value={histVenueName}
                    onChange={(e) => setHistVenueName(e.target.value)}
                    placeholder="Official Stadium"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Goalscorers Summary (Optional)
                </label>
                <input
                  type="text"
                  value={histGoalscorers}
                  onChange={(e) => setHistGoalscorers(e.target.value)}
                  placeholder="e.g. Sani 14', Bello 78'"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Match Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={histNotes}
                  onChange={(e) => setHistNotes(e.target.value)}
                  placeholder="Verified from NLO Match Commissioner sheet..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md"
              >
                {busy
                  ? 'Publishing Official FT Result...'
                  : 'Confirm & Publish Official Result (Recalculates Standings)'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900">
              Published Historical & Confirmed Results ({historicalMatches.length})
            </h2>
            {historicalMatches.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {historicalMatches.map((hm) => (
                  <div
                    key={hm.id}
                    className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <span className="font-bold text-nlo-navy">
                        {hm.groupName} {hm.weekNumber ? `• Wk ${hm.weekNumber}` : ''}
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {hm.homeTeamName} {hm.homeScore} : {hm.awayScore} {hm.awayTeamName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {hm.venueName || 'Official Venue'} • {hm.matchDate}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                      FT • VERIFIED
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-8 text-center">
                No historical match results have been published yet. Select any of the{' '}
                {resultPendingFixtures.length} RESULT_PENDING fixtures on the left to confirm its
                score.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REFEREE MANAGEMENT & GROUP PERMISSION OVERRIDES */}
      {activeTab === 'REFEREES' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Referee Accreditation & Regional Group/Centre Permissions ({referees.length})
              </h2>
              <p className="text-xs text-slate-500">
                Approve, reject, suspend, or reassign a referee&apos;s approved NLO Cup
                Group/Centre.
              </p>
            </div>
          </div>

          {referees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase font-bold">
                    <th className="py-3 px-3">Referee</th>
                    <th className="py-3 px-3">Referee ID</th>
                    <th className="py-3 px-3">Parent Zone & Approved Centre</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Reassign Group/Centre</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referees.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <strong className="text-slate-900 block">{r.fullName}</strong>
                        <span className="text-slate-500">
                          {r.email} • {r.phone}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {r.refereeIdNumber}
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-nlo-navy block">
                          {r.primaryGroupName} ({r.primaryGroupCode})
                        </strong>
                        <span className="text-slate-500">{r.parentZoneName}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-900'
                              : r.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={r.primaryGroupId}
                          onChange={(e) =>
                            handleRefereeDecision(r.id, r.status as any, e.target.value)
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold"
                        >
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.code})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        {r.status !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleRefereeDecision(r.id, 'APPROVED')}
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold"
                          >
                            Approve
                          </button>
                        )}
                        {r.status !== 'SUSPENDED' && (
                          <button
                            type="button"
                            onClick={() => handleRefereeDecision(r.id, 'SUSPENDED')}
                            className="px-2.5 py-1 rounded bg-amber-600 text-white font-bold"
                          >
                            Suspend
                          </button>
                        )}
                        {r.status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => handleRefereeDecision(r.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              No referees registered yet. Referees can register at <code>/referee/register</code>.
            </p>
          )}
        </div>
      )}

      {/* TAB 4: FIXTURE MANAGEMENT & RESOLVING THE 12 TBC KICKOFF TIMES */}
      {activeTab === 'FIXTURES' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={fixtureGroupFilter}
                onChange={(e) => setFixtureGroupFilter(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
              >
                <option value="">All 7 Groups/Centres</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code})
                  </option>
                ))}
              </select>

              <select
                value={fixtureStatusFilter}
                onChange={(e) => setFixtureStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
              >
                <option value="">All Statuses</option>
                <option value="UPCOMING">UPCOMING</option>
                <option value="RESULT_PENDING">RESULT_PENDING</option>
                <option value="LIVE">LIVE</option>
                <option value="FT">FT</option>
                <option value="POSTPONED">POSTPONED</option>
              </select>

              <label className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fixtureOnlyTbc}
                  onChange={(e) => setFixtureOnlyTbc(e.target.checked)}
                />
                Show Only TBC Kickoff Times (12 North Central Fixtures)
              </label>
            </div>

            <span className="text-xs font-bold text-slate-600">
              Showing {fixtures.length} fixture rows
            </span>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[560px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase font-bold sticky top-0">
                    <th className="py-3 px-3">Centre / Wk / M#</th>
                    <th className="py-3 px-3">Matchup</th>
                    <th className="py-3 px-3">Venue</th>
                    <th className="py-3 px-3">Date & Kickoff (WAT)</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fixtures.map((fx) => (
                    <tr key={fx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                        {fx.groupCode} • Wk {fx.weekNumber} • M#{fx.matchNumber}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {fx.isBye
                          ? `${fx.byeTeamName} (SCHEDULED BYE)`
                          : `${fx.homeTeamName} vs ${fx.awayTeamName}`}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{fx.venueName || 'TBC'}</td>
                      <td className="py-2.5 px-3 font-mono">
                        {fx.matchDate} •{' '}
                        {fx.isKickoffTbc ? (
                          <strong className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            TBC
                          </strong>
                        ) : (
                          fx.kickoffTime
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <MatchStatusBadge
                          status={fx.matchStatus || fx.fixtureStatus}
                          isKickoffTbc={fx.isKickoffTbc}
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {!fx.isBye && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFixture(fx);
                              setEditFixtureKickoff(fx.kickoffTime || 'TBC');
                              setEditFixtureDate(fx.matchDate || '');
                              setEditFixtureVenue(fx.venueName || '');
                              setEditFixtureStatus(fx.fixtureStatus);
                            }}
                            className="px-2.5 py-1 rounded bg-nlo-navy text-white font-bold"
                          >
                            Edit / Set Time
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {editingFixture && (
            <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveFixtureUpdate}
                className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs"
              >
                <h3 className="text-base font-extrabold text-slate-900">
                  Edit Fixture M/NO {editingFixture.matchNumber} ({editingFixture.homeTeamName} vs{' '}
                  {editingFixture.awayTeamName})
                </h3>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kickoff Time (e.g. 4:00 PM, 2:00 PM, or TBC)
                  </label>
                  <input
                    type="text"
                    required
                    value={editFixtureKickoff}
                    onChange={(e) => setEditFixtureKickoff(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Match Date</label>
                  <input
                    type="date"
                    value={editFixtureDate}
                    onChange={(e) => setEditFixtureDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Venue / Stadium</label>
                  <input
                    type="text"
                    value={editFixtureVenue}
                    onChange={(e) => setEditFixtureVenue(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fixture Status</label>
                  <select
                    value={editFixtureStatus}
                    onChange={(e) => setEditFixtureStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="RESULT_PENDING">RESULT_PENDING</option>
                    <option value="POSTPONED">POSTPONED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingFixture(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TEAMS MANAGEMENT */}
      {activeTab === 'TEAMS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-700" />
              Register New NLO Cup Club
            </h2>
            <form onSubmit={handleCreateTeam} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Club Name *</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. KANO PILLARS JNR FC"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assigned Group / Centre *
                </label>
                <select
                  required
                  value={newTeamGroupId}
                  onChange={(e) => setNewTeamGroupId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                >
                  <option value="">-- Select Group/Centre --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Head Coach (Optional)</label>
                <input
                  type="text"
                  value={newTeamCoach}
                  onChange={(e) => setNewTeamCoach(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 rounded-xl bg-nlo-navy text-white font-extrabold"
              >
                Create Club
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">
                All Participating Clubs ({teams.length})
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('MEDIA')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Upload Official Club Logos / Photos / Videos →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TeamCrest
                      name={t.name}
                      logoUrl={t.logoUrl}
                      hasOfficialLogo={t.hasOfficialLogo}
                      size="sm"
                    />
                    <div className="truncate">
                      <strong className="text-slate-900 block truncate">{t.name}</strong>
                      <span className="text-slate-500">{t.groupName}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaCategory('TEAM_LOGO');
                      setMediaEntityId(t.id);
                      setActiveTab('MEDIA');
                    }}
                    className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:border-emerald-600 font-bold shrink-0"
                  >
                    Upload Crest
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: REGIONS & 7 OFFICIAL GROUPS/CENTRES */}
      {activeTab === 'REGIONS' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              4 Parent Geopolitical Zones & 7 Official Competition Groups/Centres
            </h2>
            <p className="text-xs text-slate-500">
              Configured directly from the 18 official NLO Secretariat reference sheets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map((z) => (
              <div key={z.id} className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-nlo-navy text-white text-xs font-bold">
                    {z.code}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">Active Parent Zone</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{z.name}</h3>
                <p className="text-xs text-slate-600">{z.description}</p>
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  {z.groups.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-lg bg-white border border-slate-200 p-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-slate-900 block">
                          {g.name} ({g.code})
                        </strong>
                        <span className="text-slate-500">
                          {g.teamsCount ?? 0} Teams • {g.playableFixturesCount ?? 0} Playable
                          Fixtures
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                        ACTIVE
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: SIMULTANEOUS LIVE MATCH MONITOR & LOCK OVERRIDE */}
      {activeTab === 'LIVE_LOCKS' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Simultaneous Live Match Monitor & Referee Lock Override
            </h2>
            <p className="text-xs text-slate-500">
              Monitor all locked or in-play matches across the 7 Centres and release or reassign
              match locks if a referee&apos;s phone battery dies or requires emergency handover.
            </p>
          </div>

          <div className="space-y-3">
            {fixtures
              .filter((f) => !f.isBye && (f.lockedByRefereeId || f.matchStatus === 'LIVE'))
              .map((fx) => (
                <div
                  key={fx.id}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <span className="font-bold text-nlo-navy">
                      {fx.groupName} • Wk {fx.weekNumber} (M/NO {fx.matchNumber})
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {fx.homeTeamName} ({fx.homeScore ?? 0} : {fx.awayScore ?? 0}){' '}
                      {fx.awayTeamName}
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      Locked By: <strong>{fx.lockedByRefereeName || 'None'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/referee/matches/${fx.matchId || fx.id}`}
                      className="px-3 py-2 rounded-lg bg-nlo-navy text-white font-bold"
                    >
                      Open Control Centre
                    </Link>
                    {fx.lockedByRefereeId && (
                      <button
                        type="button"
                        onClick={() => handleReleaseMatchLock(fx.matchId || fx.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-600 text-white font-bold"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        Force Unlock
                      </button>
                    )}
                  </div>
                </div>
              ))}

            {fixtures.filter((f) => !f.isBye && (f.lockedByRefereeId || f.matchStatus === 'LIVE'))
              .length === 0 && (
              <p className="text-xs text-slate-500 py-6 text-center">
                No matches are currently locked or in-play right now.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: CODE-FREE MEDIA LIBRARY (TEAM LOGOS, PHOTOS, PROMOTIONAL VIDEOS) */}
      {activeTab === 'MEDIA' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Upload Official Club Logo, Photograph, or Video
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Uploading a <code>TEAM_LOGO</code> automatically replaces that club&apos;s neutral
                shield placeholder across the entire platform without editing code.
              </p>
            </div>

            <form onSubmit={handleUploadMediaAsset} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Media Category *</label>
                <select
                  value={mediaCategory}
                  onChange={(e) => setMediaCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold"
                >
                  <option value="TEAM_LOGO">Official Club Logo (TEAM_LOGO)</option>
                  <option value="TEAM_PHOTO">Team Squad Photograph (TEAM_PHOTO)</option>
                  <option value="PROMOTIONAL_VIDEO">
                    Promotional / Highlight Video (PROMOTIONAL_VIDEO)
                  </option>
                  <option value="COMPETITION_BANNER">Competition Banner</option>
                </select>
              </div>

              {(mediaCategory === 'TEAM_LOGO' ||
                mediaCategory === 'TEAM_PHOTO' ||
                mediaCategory === 'PROMOTIONAL_VIDEO') && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target NLO Cup Club *
                  </label>
                  <select
                    value={mediaEntityId}
                    onChange={(e) => setMediaEntityId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-semibold"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.groupName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Asset Title *</label>
                <input
                  type="text"
                  required
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder="e.g. Kano Pillars Jnr Official Crest"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select File (PNG/JPG/SVG/WebP or MP4/WebM) *
                </label>
                <input
                  type="file"
                  required
                  accept="image/*,video/mp4,video/webm"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  className="w-full text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center justify-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                {busy ? 'Uploading Asset...' : 'Upload & Apply Media Asset'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Uploaded Media Library ({mediaAssets.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
              {mediaAssets.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1.5"
                >
                  {m.mime_type?.startsWith('video/') ? (
                    <video src={m.public_url} className="w-full h-24 object-cover rounded" />
                  ) : (
                    <img
                      src={m.public_url}
                      alt={m.title}
                      className="w-full h-24 object-contain bg-white rounded border border-slate-200 p-1"
                    />
                  )}
                  <strong className="block truncate text-slate-900">{m.title}</strong>
                  <span className="text-[10px] font-mono text-emerald-700 block">{m.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: SEASONS & IMMUTABLE AUDIT LOGS */}
      {activeTab === 'SEASONS_AUDIT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Multi-Season Architecture ({seasons.length})
            </h2>
            <div className="space-y-2 text-xs">
              {seasons.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between"
                >
                  <div>
                    <strong className="text-slate-900 block">{s.name}</strong>
                    <span className="text-slate-500">
                      {s.startDate} → {s.endDate}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      s.isActive
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {s.isActive ? 'ACTIVE' : 'ARCHIVED/DRAFT'}
                  </span>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleCreateSeason}
              className="pt-4 border-t border-slate-200 space-y-3 text-xs"
            >
              <h3 className="font-extrabold text-slate-900">Create Future NLO Cup Season</h3>
              <input
                type="text"
                required
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                placeholder="e.g. NLO Cup 2027/2028"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={newSeasonStart}
                  onChange={(e) => setNewSeasonStart(e.target.value)}
                  className="rounded-xl border border-slate-300 px-2 py-1.5"
                />
                <input
                  type="date"
                  required
                  value={newSeasonEnd}
                  onChange={(e) => setNewSeasonEnd(e.target.value)}
                  className="rounded-xl border border-slate-300 px-2 py-1.5"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 rounded-xl bg-nlo-navy text-white font-extrabold"
              >
                Create Season
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Immutable Security & Match Audit Trail ({auditLogs.length})
            </h2>
            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1 text-xs">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-nlo-navy">{log.action}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Actor: <strong>{log.actorName || 'System'}</strong> ({log.actorRole || 'SYSTEM'}
                    ) • Entity: <code>{log.entityType}</code>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
