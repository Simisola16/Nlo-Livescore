import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  NEUTRAL_TEAM_PLACEHOLDER_URL,
  type FixtureStatus,
  type FixtureView,
  type StandingRow,
} from '@nlo-cup/package';

/**
 * Renders either the team's uploaded official logo OR a clean neutral placeholder shield.
 * Never misrepresents generated placeholders as official club crests.
 */
export const TeamCrest: React.FC<{
  name: string;
  logoUrl?: string | null;
  hasOfficialLogo?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}> = ({ name, logoUrl, hasOfficialLogo, size = 'md' }) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
  }[size];

  const isOfficial = Boolean(hasOfficialLogo && logoUrl);
  const src = isOfficial ? logoUrl! : NEUTRAL_TEAM_PLACEHOLDER_URL;

  return (
    <div
      className={`relative flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200/80 p-1 shrink-0 ${sizeClasses}`}
      title={
        isOfficial
          ? `${name} (Official Club Logo)`
          : `${name} (Neutral Placeholder — Official Logo Pending Upload)`
      }
    >
      <img
        src={src}
        alt={isOfficial ? `${name} official logo` : `${name} neutral placeholder shield`}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
};

export const MatchStatusBadge: React.FC<{
  status: FixtureStatus | string | null;
  minute?: number | null;
  stoppage?: number | null;
  isKickoffTbc?: boolean;
}> = ({ status, minute, stoppage, isKickoffTbc }) => {
  const normalized = status || 'UPCOMING';

  if (normalized === 'LIVE') {
    const minDisplay = minute
      ? stoppage && stoppage > 0
        ? `${minute}+${stoppage}'`
        : `${minute}'`
      : 'LIVE';
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide bg-rose-600 text-white shadow-sm">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse-live" />
        LIVE {minDisplay}
      </span>
    );
  }

  if (normalized === 'HT') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide bg-amber-500 text-white">
        HT • 45&apos;
      </span>
    );
  }

  if (normalized === 'FT') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide bg-slate-800 text-white">
        FT
      </span>
    );
  }

  if (normalized === 'RESULT_PENDING') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-amber-100 text-amber-900 border border-amber-300">
        RESULT PENDING
      </span>
    );
  }

  if (normalized === 'BYE') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-slate-200 text-slate-700">
        SCHEDULED BYE
      </span>
    );
  }

  if (normalized === 'POSTPONED' || normalized === 'CANCELLED' || normalized === 'SUSPENDED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide bg-red-100 text-red-800 border border-red-300">
        {normalized}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-sky-50 text-sky-800 border border-sky-200">
      {isKickoffTbc ? 'UPCOMING • TBC' : 'UPCOMING'}
    </span>
  );
};

export const MatchCard: React.FC<{ fixture: FixtureView }> = ({ fixture }) => {
  if (fixture.isBye) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-200 text-slate-700">
            M/NO {fixture.matchNumber} • Wk {fixture.weekNumber}
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {fixture.byeTeamName} — Scheduled Weekly Bye
            </p>
            <p className="text-xs text-slate-500">
              {fixture.groupName} ({fixture.byeLabel || 'Team 6 BYE'}) • Non-playable scheduling slot
            </p>
          </div>
        </div>
        <MatchStatusBadge status="BYE" />
      </div>
    );
  }

  const isScored =
    fixture.fixtureStatus === 'LIVE' ||
    fixture.fixtureStatus === 'HT' ||
    fixture.fixtureStatus === 'FT' ||
    fixture.fixtureStatus === 'SUSPENDED';

  const targetLink = `/matches/${fixture.matchId || fixture.id}`;

  return (
    <Link
      to={targetLink}
      className="group block rounded-xl bg-white border border-slate-200 hover:border-emerald-600/60 hover:shadow-md transition-all p-4"
    >
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-nlo-navy text-white shrink-0">
            {fixture.groupCode}
          </span>
          <span className="text-xs font-medium text-slate-600 truncate">
            {fixture.groupName} • Wk {fixture.weekNumber} (M/NO {fixture.matchNumber})
          </span>
        </div>
        <MatchStatusBadge
          status={fixture.matchStatus || fixture.fixtureStatus}
          minute={fixture.currentMinute}
          stoppage={fixture.stoppageTimeAdded}
          isKickoffTbc={fixture.isKickoffTbc}
        />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 my-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <TeamCrest
            name={fixture.homeTeamName}
            logoUrl={fixture.homeTeamLogoUrl}
            hasOfficialLogo={fixture.homeTeamHasOfficialLogo}
            size="md"
          />
          <span className="font-bold text-sm sm:text-base text-slate-900 leading-tight line-clamp-2 group-hover:text-nlo-navy">
            {fixture.homeTeamName}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-slate-900 text-white min-w-[78px] text-center">
          {isScored ? (
            <div className="font-mono font-extrabold text-lg sm:text-xl tracking-wider tabular-nums">
              {fixture.homeScore ?? 0} <span className="text-slate-400">:</span>{' '}
              {fixture.awayScore ?? 0}
            </div>
          ) : (
            <div className="font-mono font-bold text-xs tracking-wider text-slate-200">
              {fixture.isKickoffTbc ? (
                <span className="text-amber-300 font-extrabold">TIME TBC</span>
              ) : (
                fixture.kickoffTime || 'VS'
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 min-w-0 text-right">
          <span className="font-bold text-sm sm:text-base text-slate-900 leading-tight line-clamp-2 group-hover:text-nlo-navy">
            {fixture.awayTeamName}
          </span>
          <TeamCrest
            name={fixture.awayTeamName}
            logoUrl={fixture.awayTeamLogoUrl}
            hasOfficialLogo={fixture.awayTeamHasOfficialLogo}
            size="md"
          />
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 font-medium text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          {fixture.venueName || 'Venue TBC'}
        </span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {fixture.matchDate || 'Date TBC'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {fixture.isKickoffTbc ? (
              <strong className="text-amber-700">TBC</strong>
            ) : (
              `${fixture.kickoffTime || ''} WAT`
            )}
          </span>
        </div>
      </div>
    </Link>
  );
};

export const StandingsTable: React.FC<{
  rows: StandingRow[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
}> = ({ rows, title, subtitle, compact = false }) => {
  return (
    <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
      {(title || subtitle) && (
        <div className="bg-nlo-navy text-white px-4 py-3 flex items-center justify-between">
          <div>
            {title && <h3 className="font-bold text-sm sm:text-base tracking-wide">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-300">{subtitle}</p>}
          </div>
          <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-xs uppercase font-bold">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Team</th>
              <th className="py-2.5 px-2.5 text-center" title="Matches Played">
                P
              </th>
              <th className="py-2.5 px-2.5 text-center" title="Wins">
                W
              </th>
              <th className="py-2.5 px-2.5 text-center" title="Draws">
                D
              </th>
              <th className="py-2.5 px-2.5 text-center" title="Losses">
                L
              </th>
              {!compact && (
                <>
                  <th className="py-2.5 px-2.5 text-center" title="Goals For">
                    GF
                  </th>
                  <th className="py-2.5 px-2.5 text-center" title="Goals Against">
                    GA
                  </th>
                </>
              )}
              <th className="py-2.5 px-2.5 text-center" title="Goal Difference">
                GD
              </th>
              <th className="py-2.5 px-3 text-center font-extrabold text-nlo-navy">PTS</th>
              {!compact && <th className="py-2.5 px-3 text-center">Form</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 tabular-nums">
            {rows.map((r) => (
              <tr key={r.teamId} className="hover:bg-slate-50/90 transition-colors">
                <td className="py-2.5 px-3 text-center font-mono font-bold text-xs text-slate-600">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      r.position <= 2
                        ? 'bg-emerald-100 text-emerald-900 font-extrabold'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {r.position}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <Link
                    to={`/teams/${r.teamId}`}
                    className="flex items-center gap-2.5 font-bold text-slate-900 hover:text-emerald-700"
                  >
                    <TeamCrest
                      name={r.teamName}
                      logoUrl={r.teamLogoUrl}
                      hasOfficialLogo={r.teamHasOfficialLogo}
                      size="xs"
                    />
                    <span className="truncate">{r.teamName}</span>
                  </Link>
                </td>
                <td className="py-2.5 px-2.5 text-center font-medium text-slate-700">{r.played}</td>
                <td className="py-2.5 px-2.5 text-center text-slate-700">{r.wins}</td>
                <td className="py-2.5 px-2.5 text-center text-slate-700">{r.draws}</td>
                <td className="py-2.5 px-2.5 text-center text-slate-700">{r.losses}</td>
                {!compact && (
                  <>
                    <td className="py-2.5 px-2.5 text-center text-slate-600">{r.goalsFor}</td>
                    <td className="py-2.5 px-2.5 text-center text-slate-600">{r.goalsAgainst}</td>
                  </>
                )}
                <td className="py-2.5 px-2.5 text-center font-semibold text-slate-700">
                  {r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}
                </td>
                <td className="py-2.5 px-3 text-center font-mono font-extrabold text-nlo-navy bg-slate-50/60">
                  {r.points}
                </td>
                {!compact && (
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-1">
                      {r.formLast5 && r.formLast5.length > 0 ? (
                        r.formLast5.map((f, i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-white ${
                              f === 'W'
                                ? 'bg-emerald-600'
                                : f === 'D'
                                  ? 'bg-slate-400'
                                  : 'bg-rose-600'
                            }`}
                          >
                            {f}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

