import { DEFAULT_TIMEZONE, type TieBreakerRule } from '../constants/index.ts';
import type { StandingRow } from '../types/index.ts';

export interface CompletedMatchForStandings {
  id: string;
  seasonId: string;
  parentZoneId: string;
  groupId: string;
  matchDate: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  status: 'FT';
  isBye?: boolean;
}

export interface TeamForStandings {
  id: string;
  name: string;
  parentZoneId: string;
  groupId: string;
  logoUrl: string | null;
  hasOfficialLogo: boolean;
}

export interface StandingsConfig {
  pointsPerWin: number;
  pointsPerDraw: number;
  pointsPerLoss: number;
  tieBreakerRules: TieBreakerRule[];
}

const DEFAULT_CONFIG: StandingsConfig = {
  pointsPerWin: 3,
  pointsPerDraw: 1,
  pointsPerLoss: 0,
  tieBreakerRules: ['POINTS', 'GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD', 'WINS'],
};

/**
 * Pure, deterministic standings calculator.
 * Strictly ignores any BYE entry (isBye === true) and any match whose status is not 'FT'.
 */
export function calculateGroupStandings(
  seasonId: string,
  teams: TeamForStandings[],
  completedMatches: CompletedMatchForStandings[],
  config: Partial<StandingsConfig> = {}
): StandingRow[] {
  const rules: StandingsConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    tieBreakerRules: config.tieBreakerRules?.length
      ? config.tieBreakerRules
      : DEFAULT_CONFIG.tieBreakerRules,
  };

  // Filter strictly to verified FT playable matches with valid teams
  const validMatches = completedMatches
    .filter(
      (m) =>
        !m.isBye &&
        m.status === 'FT' &&
        Boolean(m.homeTeamId) &&
        Boolean(m.awayTeamId) &&
        m.homeTeamId !== m.awayTeamId &&
        typeof m.homeScore === 'number' &&
        typeof m.awayScore === 'number'
    )
    .sort((a, b) => a.matchDate.localeCompare(b.matchDate));

  const map = new Map<string, StandingRow>();
  for (const team of teams) {
    map.set(team.id, {
      seasonId,
      parentZoneId: team.parentZoneId,
      groupId: team.groupId,
      teamId: team.id,
      teamName: team.name,
      teamLogoUrl: team.logoUrl,
      teamHasOfficialLogo: team.hasOfficialLogo,
      position: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      formLast5: [],
    });
  }

  // Track head-to-head points and goal difference between pairs
  const h2hMap = new Map<string, { points: number; gd: number; gf: number }>();
  const getH2HKey = (teamA: string, teamB: string) => `${teamA}__vs__${teamB}`;

  for (const match of validMatches) {
    const home = map.get(match.homeTeamId);
    const away = map.get(match.awayTeamId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    const hKey = getH2HKey(home.teamId, away.teamId);
    const aKey = getH2HKey(away.teamId, home.teamId);
    const hRec = h2hMap.get(hKey) ?? { points: 0, gd: 0, gf: 0 };
    const aRec = h2hMap.get(aKey) ?? { points: 0, gd: 0, gf: 0 };

    hRec.gf += match.homeScore;
    hRec.gd += match.homeScore - match.awayScore;
    aRec.gf += match.awayScore;
    aRec.gd += match.awayScore - match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.wins += 1;
      home.points += rules.pointsPerWin;
      home.formLast5.push('W');

      away.losses += 1;
      away.points += rules.pointsPerLoss;
      away.formLast5.push('L');

      hRec.points += rules.pointsPerWin;
      aRec.points += rules.pointsPerLoss;
    } else if (match.homeScore < match.awayScore) {
      away.wins += 1;
      away.points += rules.pointsPerWin;
      away.formLast5.push('W');

      home.losses += 1;
      home.points += rules.pointsPerLoss;
      home.formLast5.push('L');

      aRec.points += rules.pointsPerWin;
      hRec.points += rules.pointsPerLoss;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += rules.pointsPerDraw;
      away.points += rules.pointsPerDraw;
      home.formLast5.push('D');
      away.formLast5.push('D');

      hRec.points += rules.pointsPerDraw;
      aRec.points += rules.pointsPerDraw;
    }

    h2hMap.set(hKey, hRec);
    h2hMap.set(aKey, aRec);
  }

  const rows = Array.from(map.values()).map((row) => ({
    ...row,
    goalDifference: row.goalsFor - row.goalsAgainst,
    formLast5: row.formLast5.slice(-5),
  }));

  rows.sort((a, b) => {
    for (const criterion of rules.tieBreakerRules) {
      if (criterion === 'POINTS' && b.points !== a.points) {
        return b.points - a.points;
      }
      if (criterion === 'GOAL_DIFFERENCE' && b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      if (criterion === 'GOALS_FOR' && b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      if (criterion === 'WINS' && b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      if (criterion === 'HEAD_TO_HEAD') {
        const aVsB = h2hMap.get(getH2HKey(a.teamId, b.teamId));
        const bVsA = h2hMap.get(getH2HKey(b.teamId, a.teamId));
        if (aVsB && bVsA) {
          if (bVsA.points !== aVsB.points) return bVsA.points - aVsB.points;
          if (bVsA.gd !== aVsB.gd) return bVsA.gd - aVsB.gd;
          if (bVsA.gf !== aVsB.gf) return bVsA.gf - aVsB.gf;
        }
      }
    }
    return a.teamName.localeCompare(b.teamName);
  });

  return rows.map((row, idx) => ({
    ...row,
    position: idx + 1,
  }));
}

/**
 * Returns the current date string (YYYY-MM-DD) in Africa/Lagos (WAT, UTC+01:00).
 */
export function getCurrentWatDateString(referenceDateOverride?: string | Date): string {
  if (typeof referenceDateOverride === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(referenceDateOverride)) {
    return referenceDateOverride;
  }
  const dateObj = referenceDateOverride instanceof Date ? referenceDateOverride : new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(dateObj);
}

/**
 * Evaluates whether a playable fixture date is in the past relative to Africa/Lagos (WAT)
 * and should be marked RESULT_PENDING until an official score is confirmed.
 */
export function resolveInitialPlayableFixtureStatus(
  matchDateIso: string,
  watTodayIso: string = getCurrentWatDateString()
): 'RESULT_PENDING' | 'UPCOMING' {
  return matchDateIso < watTodayIso ? 'RESULT_PENDING' : 'UPCOMING';
}

/**
 * Calculates live match minute and display clock from period start and elapsed seconds.
 */
export function computeLiveMatchMinute(params: {
  currentPeriod: string;
  currentMinute: number;
  elapsedSecondsBeforePeriod: number;
  periodStartedAt: string | null;
  isClockRunning: boolean;
  nowMs?: number;
}): { minute: number; seconds: number; displayClock: string } {
  const {
    currentPeriod,
    currentMinute,
    elapsedSecondsBeforePeriod,
    periodStartedAt,
    isClockRunning,
    nowMs = Date.now(),
  } = params;

  if (!isClockRunning || !periodStartedAt) {
    const mins = Math.max(0, currentMinute);
    return {
      minute: mins,
      seconds: 0,
      displayClock: `${String(mins).padStart(2, '0')}:00`,
    };
  }

  const startedMs = new Date(periodStartedAt).getTime();
  const deltaSeconds = Math.max(0, Math.floor((nowMs - startedMs) / 1000));
  const totalSeconds = elapsedSecondsBeforePeriod + deltaSeconds;
  const computedMinute = Math.max(1, Math.floor(totalSeconds / 60) + 1);
  const seconds = totalSeconds % 60;

  let baseMinute = computedMinute;
  if (currentPeriod === 'SECOND_HALF' && elapsedSecondsBeforePeriod < 45 * 60) {
    baseMinute = 45 + Math.floor(deltaSeconds / 60) + 1;
  }

  return {
    minute: baseMinute,
    seconds,
    displayClock: `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
}

