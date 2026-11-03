import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Shield,
  Trophy,
  Video,
} from 'lucide-react';
import type { FixtureView, HistoricalMatchView, Team } from '@nlo-cup/package';
import { apiRequest } from '../../services/api.ts';
import { MatchCard, TeamCrest } from '../../components/SharedComponents.tsx';

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [standing, setStanding] = useState<any | null>(null);
  const [fixtures, setFixtures] = useState<FixtureView[]>([]);
  const [historicalMatches, setHistoricalMatches] = useState<HistoricalMatchView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    apiRequest<{
      team: Team;
      standing: any;
      fixtures: FixtureView[];
      historicalMatches: HistoricalMatchView[];
    }>(`/api/public/teams/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!active) return;
        setTeam(res.team);
        setStanding(res.standing);
        setFixtures(res.fixtures);
        setHistoricalMatches(res.historicalMatches || []);
      })
      .catch((err) => console.error('Failed to load team details:', err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        Loading club profile...
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center space-y-3">
        <h2 className="text-xl font-extrabold text-slate-900">Team Not Found</h2>
        <Link to="/teams" className="text-xs font-bold text-emerald-700 underline">
          Return to Participating Clubs Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        to="/teams"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-nlo-navy"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All 46 Participating Teams
      </Link>

      {/* Club Banner */}
      <div className="rounded-2xl bg-nlo-navy text-white p-6 sm:p-8 border-b-4 border-emerald-500 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <TeamCrest
              name={team.name}
              logoUrl={team.logoUrl}
              hasOfficialLogo={team.hasOfficialLogo}
              size="lg"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white text-xs font-bold">
                  {team.groupName} ({team.groupCode})
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold">
                  {team.parentZoneName}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-amber-300 text-[11px] font-semibold">
                  {team.hasOfficialLogo
                    ? 'Official Club Crest Verified'
                    : 'Neutral Placeholder Shield (Pending Official Logo Upload)'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{team.name}</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Home Stadium / Centre: {team.homeVenueName || 'Official Competition Centre'}
              </p>
            </div>
          </div>

          {standing && (
            <div className="grid grid-cols-4 gap-2.5 bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 text-center shrink-0">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Rank</span>
                <strong className="text-lg font-mono text-emerald-400">
                  #{standing.position}
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Played</span>
                <strong className="text-lg font-mono text-white">{standing.played}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">GD</span>
                <strong className="text-lg font-mono text-white">
                  {standing.goal_difference > 0
                    ? `+${standing.goal_difference}`
                    : standing.goal_difference}
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Points</span>
                <strong className="text-lg font-mono text-amber-300">{standing.points}</strong>
              </div>
            </div>
          )}
        </div>

        {team.description && (
          <p className="mt-4 pt-4 border-t border-slate-800 text-xs sm:text-sm text-slate-300">
            {team.description}
          </p>
        )}
      </div>

      {/* Optional Uploaded Team Photograph / Promo Video */}
      {(team.teamPhotoUrl || team.promoVideoUrl) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {team.teamPhotoUrl && (
            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 mb-3">Official Team Photograph</h3>
              <img
                src={team.teamPhotoUrl}
                alt={`${team.name} squad`}
                className="w-full h-64 object-cover rounded-lg border border-slate-200"
              />
            </div>
          )}
          {team.promoVideoUrl && (
            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-emerald-600" />
                Official Club Media / Highlight Video
              </h3>
              <video
                src={team.promoVideoUrl}
                controls
                className="w-full h-64 rounded-lg bg-slate-950"
              />
            </div>
          )}
        </div>
      )}

      {/* Team Fixtures & Match Schedule */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            Official NLO Cup Fixtures for {team.name} ({fixtures.length})
          </h2>
          <Link
            to={`/standings`}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <Trophy className="w-3.5 h-3.5" />
            View {team.groupName} Table
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fixtures.map((fx) => (
            <MatchCard key={fx.id} fixture={fx} />
          ))}
        </div>
      </section>
    </div>
  );
};

