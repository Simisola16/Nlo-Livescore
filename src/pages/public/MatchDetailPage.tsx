import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRightLeft,
  Calendar,
  Clock,
  FileImage,
  MapPin,
  Radio,
  Shield,
  Trophy,
  UserCheck,
} from 'lucide-react';
import type { FixtureView, MatchEventView, MatchStats } from '@nlo-cup/package';
import { useApp } from '../../context/AppContext.tsx';
import { apiRequest, getSocket } from '../../services/api.ts';
import { MatchStatusBadge, TeamCrest } from '../../components/SharedComponents.tsx';

export const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { lastRealtimeTick, user } = useApp();
  const [match, setMatch] = useState<FixtureView | null>(null);
  const [events, setEvents] = useState<MatchEventView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    socket.emit('join:match', id);
    return () => {
      socket.emit('leave:match', id);
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const loadDetails = async () => {
      try {
        const res = await apiRequest<{
          match: FixtureView;
          events: MatchEventView[];
        }>(`/api/public/matches/${encodeURIComponent(id)}`);
        if (!active) return;
        setMatch(res.match);
        setEvents(res.events || []);
        setError('');
      } catch (err: any) {
        if (active) setError(err.message || 'Match not found');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadDetails();
    return () => {
      active = false;
    };
  }, [id, lastRealtimeTick]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        Loading match center...
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center space-y-3">
        <h2 className="text-xl font-extrabold text-slate-900">{error || 'Match Not Found'}</h2>
        <Link to="/fixtures" className="text-xs font-bold text-emerald-700 underline">
          Return to Fixtures Schedule
        </Link>
      </div>
    );
  }

  const stats: MatchStats = match.stats || {
    homePossession: 50,
    awayPossession: 50,
    homeShots: 0,
    awayShots: 0,
    homeShotsOnTarget: 0,
    awayShotsOnTarget: 0,
    homeCorners: 0,
    awayCorners: 0,
    homeFouls: 0,
    awayFouls: 0,
    homeOffsides: 0,
    awayOffsides: 0,
    homeYellowCards: 0,
    awayYellowCards: 0,
    homeRedCards: 0,
    awayRedCards: 0,
  };

  const goals = events.filter((e) =>
    ['GOAL', 'PENALTY_GOAL', 'OWN_GOAL'].includes(e.eventType)
  );
  const yellowCards = events.filter((e) => e.eventType === 'YELLOW_CARD');
  const redCards = events.filter((e) =>
    ['RED_CARD', 'SECOND_YELLOW_RED'].includes(e.eventType)
  );
  const substitutions = events.filter((e) => e.eventType === 'SUBSTITUTION');

  const statRows = [
    { label: 'Ball Possession (%)', home: stats.homePossession, away: stats.awayPossession },
    { label: 'Total Shots', home: stats.homeShots, away: stats.awayShots },
    { label: 'Shots on Target', home: stats.homeShotsOnTarget, away: stats.awayShotsOnTarget },
    { label: 'Corner Kicks', home: stats.homeCorners, away: stats.awayCorners },
    { label: 'Fouls Committed', home: stats.homeFouls, away: stats.awayFouls },
    { label: 'Offsides', home: stats.homeOffsides, away: stats.awayOffsides },
    { label: 'Yellow Cards', home: stats.homeYellowCards, away: stats.awayYellowCards },
    { label: 'Red Cards', home: stats.homeRedCards, away: stats.awayRedCards },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Referee Control Link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/fixtures"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-nlo-navy"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fixtures & Live Scoreboard
        </Link>

        {user?.role === 'REFEREE' && match.matchId && (
          <Link
            to={`/referee/matches/${match.matchId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
          >
            <Radio className="w-3.5 h-3.5" />
            Open Referee Live Match Control Centre
          </Link>
        )}
      </div>

      {/* Main Broadcast Scoreboard Header */}
      <div className="rounded-2xl bg-gradient-to-br from-nlo-navy via-[#0E2240] to-slate-950 text-white p-6 sm:p-8 border-b-4 border-emerald-500 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white font-bold">
              {match.groupName} ({match.groupCode})
            </span>
            <span>•</span>
            <span>{match.parentZoneName}</span>
            <span>•</span>
            <span className="font-mono font-bold text-amber-300">
              Week {match.weekNumber} • Match #{match.matchNumber}
            </span>
          </div>

          <MatchStatusBadge
            status={match.matchStatus || match.fixtureStatus}
            minute={match.currentMinute}
            stoppage={match.stoppageTimeAdded}
            isKickoffTbc={match.isKickoffTbc}
          />
        </div>

        {/* Teams & Scoreboard */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 my-4">
          {/* Home Team */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <TeamCrest
              name={match.homeTeamName}
              logoUrl={match.homeTeamLogoUrl}
              hasOfficialLogo={match.homeTeamHasOfficialLogo}
              size="lg"
            />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold block">
                Home Club
              </span>
              <Link
                to={`/teams/${match.homeTeamId}`}
                className="text-xl sm:text-2xl font-extrabold text-white hover:text-emerald-300"
              >
                {match.homeTeamName}
              </Link>
            </div>
          </div>

          {/* Center Scoreboard Box */}
          <div className="flex flex-col items-center justify-center px-8 py-4 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-inner min-w-[180px]">
            <div className="font-mono font-extrabold text-4xl sm:text-5xl tracking-wider tabular-nums text-white">
              {match.homeScore ?? 0} <span className="text-emerald-400">:</span>{' '}
              {match.awayScore ?? 0}
            </div>
            <div className="mt-2 text-xs font-mono font-bold text-slate-300">
              {match.currentPeriod ? `Period: ${match.currentPeriod}` : match.fixtureStatus}
              {match.currentMinute ? ` • ${match.currentMinute}'` : ''}
              {match.stoppageTimeAdded ? `+${match.stoppageTimeAdded}'` : ''}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col sm:flex-row-reverse items-center gap-4 text-center sm:text-right">
            <TeamCrest
              name={match.awayTeamName}
              logoUrl={match.awayTeamLogoUrl}
              hasOfficialLogo={match.awayTeamHasOfficialLogo}
              size="lg"
            />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-sky-400 font-bold block">
                Away Club
              </span>
              <Link
                to={`/teams/${match.awayTeamId}`}
                className="text-xl sm:text-2xl font-extrabold text-white hover:text-emerald-300"
              >
                {match.awayTeamName}
              </Link>
            </div>
          </div>
        </div>

        {/* Venue, Date, Time & Referee Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <strong>Venue:</strong> {match.venueName || 'Official Venue TBC'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <strong>Date:</strong> {match.matchDate || 'TBC'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <strong>Kickoff:</strong>{' '}
              {match.isKickoffTbc ? (
                <span className="text-amber-300 font-bold">TBC</span>
              ) : (
                `${match.kickoffTime} WAT`
              )}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-slate-300">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <strong>Match Official:</strong>{' '}
            {match.lockedByRefereeName ||
              match.assignedRefereeName ||
              'Assigned by NLO Referee Committee'}
          </div>
        </div>
      </div>

      {/* Main Content Columns: Timeline + Match Summary & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: Chronological Match Timeline & Event Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-extrabold text-slate-900">
                  Chronological Match Timeline ({events.length})
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Real-Time Event Stream
              </span>
            </div>

            {events.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-emerald-500/40 space-y-4">
                {events.map((ev) => {
                  const isHome = ev.teamId === match.homeTeamId;
                  const minStr =
                    ev.extraMinute && ev.extraMinute > 0
                      ? `${ev.matchMinute}+${ev.extraMinute}'`
                      : `${ev.matchMinute}'`;

                  let badgeColor = 'bg-slate-800 text-white';
                  if (['GOAL', 'PENALTY_GOAL'].includes(ev.eventType)) {
                    badgeColor = 'bg-emerald-600 text-white';
                  } else if (ev.eventType === 'OWN_GOAL') {
                    badgeColor = 'bg-rose-700 text-white';
                  } else if (ev.eventType === 'YELLOW_CARD') {
                    badgeColor = 'bg-amber-400 text-slate-950';
                  } else if (['RED_CARD', 'SECOND_YELLOW_RED'].includes(ev.eventType)) {
                    badgeColor = 'bg-rose-600 text-white';
                  } else if (ev.eventType === 'SUBSTITUTION') {
                    badgeColor = 'bg-sky-600 text-white';
                  }

                  return (
                    <div
                      key={ev.id}
                      className="relative rounded-xl bg-slate-50 border border-slate-200/80 p-3.5"
                    >
                      <span className="absolute -left-[33px] top-4 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded bg-nlo-navy text-white">
                            {minStr}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${badgeColor}`}
                          >
                            {ev.eventType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {ev.teamName || (isHome ? match.homeTeamName : match.awayTeamName)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{ev.period}</span>
                      </div>

                      <div className="mt-2 text-sm font-bold text-slate-900">
                        {ev.playerName}
                        {ev.secondaryPlayerName && (
                          <span className="text-xs font-medium text-slate-600 ml-2">
                            {ev.eventType === 'SUBSTITUTION'
                              ? `(Replaced: ${ev.secondaryPlayerName})`
                              : `(Assist: ${ev.secondaryPlayerName})`}
                          </span>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-xs text-slate-600 mt-1">{ev.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center space-y-2 text-slate-500">
                <Radio className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  No Timeline Events Recorded Yet
                </p>
                <p className="text-xs max-w-md mx-auto">
                  Goals, yellow cards, red cards, substitutions, and match incidents appear here in
                  chronological order as soon as the officiating referee records them.
                </p>
              </div>
            )}
          </div>

          {/* Categorized Quick Breakdown: Goals, Cards, Substitutions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-emerald-800 mb-2">
                Goals ({goals.length})
              </h3>
              {goals.length > 0 ? (
                <ul className="space-y-1.5 text-xs">
                  {goals.map((g) => (
                    <li key={g.id} className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        ⚽ {g.playerName} ({g.teamName})
                      </span>
                      <span className="font-mono font-bold text-emerald-700">
                        {g.matchMinute}&apos;
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No goals recorded</p>
              )}
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-amber-800 mb-2">
                Disciplinary Cards ({yellowCards.length} YC / {redCards.length} RC)
              </h3>
              {yellowCards.length + redCards.length > 0 ? (
                <ul className="space-y-1.5 text-xs">
                  {[...yellowCards, ...redCards].map((c) => (
                    <li key={c.id} className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {c.eventType === 'YELLOW_CARD' ? '🟨' : '🟥'} {c.playerName} ({c.teamName})
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {c.matchMinute}&apos;
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No disciplinary cards recorded</p>
              )}
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm sm:col-span-2">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-sky-800 mb-2 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Substitutions ({substitutions.length})
              </h3>
              {substitutions.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {substitutions.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200/70"
                    >
                      <span>
                        <strong className="text-emerald-700">IN:</strong> {s.playerName}{' '}
                        {s.secondaryPlayerName ? (
                          <span className="text-rose-700">• OUT: {s.secondaryPlayerName}</span>
                        ) : null}
                      </span>
                      <span className="font-mono font-bold">{s.matchMinute}&apos;</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No substitutions recorded</p>
              )}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Match Statistics & Match Information */}
        <div className="lg:col-span-5 space-y-6">
          {/* Match Statistics */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 pb-3 border-b border-slate-100">
              Match Statistics
            </h2>

            <div className="space-y-3.5">
              {statRows.map((row) => {
                const total = row.home + row.away || 1;
                const homePct = Math.round((row.home / total) * 100);
                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="font-mono text-nlo-navy">{row.home}</span>
                      <span className="text-slate-600">{row.label}</span>
                      <span className="font-mono text-emerald-700">{row.away}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        className="bg-nlo-navy h-full transition-all"
                        style={{ width: `${homePct}%` }}
                      />
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${100 - homePct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Match Information Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-3 text-xs">
            <h2 className="text-base font-extrabold text-slate-900 pb-2 border-b border-slate-100">
              Official Match Information
            </h2>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Competition Season</span>
              <strong className="text-slate-900">{match.seasonName}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Parent Geopolitical Zone</span>
              <strong className="text-slate-900">{match.parentZoneName}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Competition Group / Centre</span>
              <strong className="text-slate-900">
                {match.groupName} ({match.groupCode})
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Fixture Number & Week</span>
              <strong className="font-mono text-slate-900">
                M/NO {match.matchNumber} • Week {match.weekNumber} ({match.legHalf})
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Stadium / Venue</span>
              <strong className="text-slate-900">{match.venueName || 'Venue TBC'}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Kickoff Time (Africa/Lagos)</span>
              <strong className="text-slate-900">
                {match.isKickoffTbc ? 'TBC (To Be Confirmed)' : `${match.kickoffTime} WAT`}
              </strong>
            </div>
            {match.sourceReferenceImage && (
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Verified Reference Sheet</span>
                <a
                  href={`/content/images/references/${match.sourceReferenceImage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 hover:underline"
                >
                  <FileImage className="w-3.5 h-3.5" />
                  {match.sourceReferenceImage}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

