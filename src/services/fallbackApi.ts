import {
  NEUTRAL_TEAM_PLACEHOLDER_URL,
  NFF_OFFICIAL_CREST_URL,
  NLO_OFFICIAL_LOGO_URL,
  OFFICIAL_COMPETITION_GROUPS,
  OFFICIAL_PARENT_ZONES,
  calculateGroupStandings,
  resolveInitialPlayableFixtureStatus,
  type AuditLogEntry,
  type CompetitionGroup,
  type FixtureView,
  type HistoricalMatchView,
  type MatchEventView,
  type NotificationRecord,
  type RefereeProfile,
  type Season,
  type StandingRow,
  type Team,
  type User,
} from '@nlo-cup/package';
import {
  OFFICIAL_CLUB_LOGOS,
  OFFICIAL_COMPLETED_NLO_RESULTS,
  OFFICIAL_NLO_2026_FIXTURES,
  OFFICIAL_TEAMS_BY_GROUP,
  normalizeOfficialVenueName,
} from '../data/officialNlo2026Data.ts';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface FallbackState {
  seasons: Season[];
  zones: {
    id: string;
    name: string;
    code: string;
    description: string;
    isActive: boolean;
  }[];
  groups: (CompetitionGroup & { teamsCount: number; playableFixturesCount: number })[];
  teams: Team[];
  fixtures: FixtureView[];
  historicalMatches: HistoricalMatchView[];
  eventsByMatchId: Record<string, MatchEventView[]>;
  referees: RefereeProfile[];
  users: (User & { password?: string })[];
  auditLogs: AuditLogEntry[];
  mediaAssets: any[];
  notifications: NotificationRecord[];
}

const STORAGE_KEY = 'nlo_cup_live_fallback_state_v2';

let cachedState: FallbackState | null = null;

function buildInitialState(): FallbackState {
  const seasonId = 'season-2026-2027-nlo-cup';
  const archiveSeasonId = 'season-2025-2026-nlo-cup';
  const watReferenceDate = '2026-11-03';

  const seasons: Season[] = [
    {
      id: seasonId,
      name: '2026/2027 NLO Cup',
      slug: '2026-2027-nlo-cup',
      startDate: '2026-10-17',
      endDate: '2027-01-31',
      timezone: 'Africa/Lagos',
      isActive: true,
      isArchived: false,
      pointsPerWin: 3,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
      tieBreakerRules: ['POINTS', 'GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD', 'ALPHABETICAL'],
      createdAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: archiveSeasonId,
      name: '2025/2026 NLO Cup (Archive)',
      slug: '2025-2026-nlo-cup',
      startDate: '2025-10-15',
      endDate: '2026-01-25',
      timezone: 'Africa/Lagos',
      isActive: false,
      isArchived: true,
      pointsPerWin: 3,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
      tieBreakerRules: ['POINTS', 'GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD', 'ALPHABETICAL'],
      createdAt: '2025-10-01T00:00:00.000Z',
    },
  ];

  const zones = OFFICIAL_PARENT_ZONES.map((z) => ({
    id: `zone-${slugify(z.code)}`,
    name: z.name,
    code: z.code,
    description: z.description,
    isActive: true,
  }));
  const zoneByCode = new Map(zones.map((z) => [z.code, z]));

  const groups: (CompetitionGroup & { teamsCount: number; playableFixturesCount: number })[] =
    OFFICIAL_COMPETITION_GROUPS.map((g) => {
      const pZone = zoneByCode.get(g.parentZoneCode)!;
      return {
        id: `group-${slugify(g.code)}`,
        seasonId,
        parentZoneId: pZone.id,
        parentZoneName: pZone.name,
        parentZoneCode: pZone.code as any,
        name: g.name,
        code: g.code,
        format: g.format,
        hasByeSlot: g.hasByeSlot,
        referenceImages: [...g.referenceImages],
        isActive: true,
        teamsCount: 0,
        playableFixturesCount: 0,
      };
    });
  const groupByCode = new Map(groups.map((g) => [g.code, g]));

  const teams: Team[] = [];
  const teamByGroupAndName = new Map<string, Team>();

  for (const [groupCode, groupTeams] of Object.entries(OFFICIAL_TEAMS_BY_GROUP) as [
    keyof typeof OFFICIAL_TEAMS_BY_GROUP,
    (typeof OFFICIAL_TEAMS_BY_GROUP)['SW-A'],
  ][]) {
    const grp = groupByCode.get(groupCode)!;
    for (const t of groupTeams) {
      const normalizedVenue = normalizeOfficialVenueName(t.homeVenue) || t.homeVenue;
      const officialLogoUrl = OFFICIAL_CLUB_LOGOS[t.name] || null;
      const teamId = `team-${slugify(`${groupCode}-${t.name}`)}`;
      const teamObj: Team = {
        id: teamId,
        name: t.name,
        shortName: t.shortName,
        slug: slugify(`${groupCode}-${t.name}`),
        parentZoneId: grp.parentZoneId,
        parentZoneName: grp.parentZoneName,
        groupId: grp.id,
        groupName: grp.name,
        groupCode: grp.code,
        homeVenueId: `venue-${slugify(normalizedVenue)}`,
        homeVenueName: normalizedVenue,
        logoUrl: officialLogoUrl,
        hasOfficialLogo: Boolean(officialLogoUrl),
        teamPhotoUrl: null,
        promoVideoUrl: null,
        foundedYear: null,
        headCoach: null,
        description: `Official participating club in the 2026/2027 NLO Cup (${grp.name}, ${grp.parentZoneName} Zone).`,
        isActive: true,
      };
      teams.push(teamObj);
      teamByGroupAndName.set(`${groupCode}:${t.name.toUpperCase()}`, teamObj);
    }
  }

  const ensureTeam = (groupCode: CompetitionGroup['code'], rawName: string): Team => {
    const key = `${groupCode}:${rawName.trim().toUpperCase()}`;
    const existing = teamByGroupAndName.get(key);
    if (existing) return existing;
    const grp = groupByCode.get(groupCode)!;
    const officialLogoUrl = OFFICIAL_CLUB_LOGOS[rawName.trim().toUpperCase()] || null;
    const shortName = rawName.replace(/\s+(FC|FA|SC|JNR)$/i, '').slice(0, 14).trim();
    const teamObj: Team = {
      id: `team-${slugify(`${groupCode}-${rawName}`)}`,
      name: rawName.trim().toUpperCase(),
      shortName,
      slug: slugify(`${groupCode}-${rawName}`),
      parentZoneId: grp.parentZoneId,
      parentZoneName: grp.parentZoneName,
      groupId: grp.id,
      groupName: grp.name,
      groupCode: grp.code,
      homeVenueId: null,
      homeVenueName: null,
      logoUrl: officialLogoUrl,
      hasOfficialLogo: Boolean(officialLogoUrl),
      teamPhotoUrl: null,
      promoVideoUrl: null,
      foundedYear: null,
      headCoach: null,
      description: `Official participating club in the 2026/2027 NLO Cup (${grp.name}).`,
      isActive: true,
    };
    teams.push(teamObj);
    teamByGroupAndName.set(key, teamObj);
    return teamObj;
  };

  // Ensure all teams from completed results exist
  for (const res of OFFICIAL_COMPLETED_NLO_RESULTS) {
    ensureTeam(res.groupCode, res.homeTeamName);
    ensureTeam(res.groupCode, res.awayTeamName);
  }

  const completedKeyMap = new Map<string, (typeof OFFICIAL_COMPLETED_NLO_RESULTS)[number]>();
  for (const res of OFFICIAL_COMPLETED_NLO_RESULTS) {
    completedKeyMap.set(`${res.groupCode}:${res.matchNumber}`, res);
    completedKeyMap.set(
      `${res.groupCode}:${res.homeTeamName.toUpperCase()}:${res.awayTeamName.toUpperCase()}`,
      res
    );
  }
  const usedCompletedResults = new Set<(typeof OFFICIAL_COMPLETED_NLO_RESULTS)[number]>();

  const fixtures: FixtureView[] = [];
  const historicalMatches: HistoricalMatchView[] = [];

  for (const fx of OFFICIAL_NLO_2026_FIXTURES) {
    const grp = groupByCode.get(fx.groupCode)!;
    const fixtureId = `fixture-${slugify(fx.groupCode)}-m${fx.matchNumber}-w${fx.weekNumber}`;
    const matchId = `match-${slugify(fx.groupCode)}-m${fx.matchNumber}-w${fx.weekNumber}`;
    const normalizedVenue = normalizeOfficialVenueName(fx.venueName) || fx.venueName || null;

    if (fx.isBye) {
      const byeTeam = fx.byeTeamName ? ensureTeam(fx.groupCode, fx.byeTeamName) : null;
      fixtures.push({
        id: fixtureId,
        seasonId,
        seasonName: '2026/2027 NLO Cup',
        parentZoneId: grp.parentZoneId,
        parentZoneName: grp.parentZoneName,
        groupId: grp.id,
        groupName: grp.name,
        groupCode: grp.code,
        matchNumber: fx.matchNumber,
        weekNumber: fx.weekNumber,
        legHalf: fx.legHalf,
        isBye: true,
        homeTeamId: null,
        homeTeamName: null,
        homeTeamLogoUrl: null,
        homeTeamHasOfficialLogo: false,
        awayTeamId: null,
        awayTeamName: null,
        awayTeamLogoUrl: null,
        awayTeamHasOfficialLogo: false,
        byeTeamId: byeTeam?.id || null,
        byeTeamName: byeTeam?.name || fx.byeTeamName || null,
        byeLabel: fx.byeLabel || 'BYE',
        venueId: null,
        venueName: null,
        matchDate: fx.matchDate,
        kickoffTime: null,
        isKickoffTbc: false,
        fixtureStatus: 'BYE',
        sourceReferenceImage: fx.sourceReferenceImage,
        sheetNotes: fx.sheetNotes || null,
        match: null,
      });
      continue;
    }

    const homeTeam = ensureTeam(fx.groupCode, fx.homeTeamName!);
    const awayTeam = ensureTeam(fx.groupCode, fx.awayTeamName!);

    const completedMatch =
      completedKeyMap.get(`${fx.groupCode}:${fx.matchNumber}`) ||
      completedKeyMap.get(
        `${fx.groupCode}:${homeTeam.name.toUpperCase()}:${awayTeam.name.toUpperCase()}`
      );

    if (completedMatch && !usedCompletedResults.has(completedMatch)) {
      usedCompletedResults.add(completedMatch);
      const playedDate = completedMatch.playedDate || fx.matchDate || '2026-10-17';
      const venueName =
        normalizeOfficialVenueName(completedMatch.venueName) || normalizedVenue || 'Official Venue';

      fixtures.push({
        id: fixtureId,
        seasonId,
        seasonName: '2026/2027 NLO Cup',
        parentZoneId: grp.parentZoneId,
        parentZoneName: grp.parentZoneName,
        groupId: grp.id,
        groupName: grp.name,
        groupCode: grp.code,
        matchNumber: fx.matchNumber,
        weekNumber: fx.weekNumber,
        legHalf: fx.legHalf,
        isBye: false,
        homeTeamId: homeTeam.id,
        homeTeamName: homeTeam.name,
        homeTeamLogoUrl: homeTeam.logoUrl,
        homeTeamHasOfficialLogo: homeTeam.hasOfficialLogo,
        awayTeamId: awayTeam.id,
        awayTeamName: awayTeam.name,
        awayTeamLogoUrl: awayTeam.logoUrl,
        awayTeamHasOfficialLogo: awayTeam.hasOfficialLogo,
        byeTeamId: null,
        byeTeamName: null,
        byeLabel: null,
        venueId: `venue-${slugify(venueName)}`,
        venueName,
        matchDate: playedDate,
        kickoffTime: fx.kickoffTime || '16:00',
        isKickoffTbc: false,
        fixtureStatus: 'FT',
        sourceReferenceImage: fx.sourceReferenceImage,
        sheetNotes: fx.sheetNotes || null,
        match: {
          id: matchId,
          status: 'FT',
          currentPeriod: 'FT',
          homeScore: completedMatch.homeScore,
          awayScore: completedMatch.awayScore,
          currentMinute: 90,
          stoppageTimeAdded: 0,
          isClockRunning: false,
          periodStartedAt: null,
          elapsedSecondsBeforePeriod: 5400,
          lockedByRefereeId: null,
          lockedByRefereeName: null,
          assignedRefereeId: null,
          assignedRefereeName: null,
        },
      });

      historicalMatches.push({
        id: `hist-${fixtureId}`,
        seasonId,
        seasonName: '2026/2027 NLO Cup',
        parentZoneId: grp.parentZoneId,
        parentZoneName: grp.parentZoneName,
        groupId: grp.id,
        groupName: grp.name,
        groupCode: grp.code,
        linkedFixtureId: fixtureId,
        matchNumber: fx.matchNumber,
        weekNumber: fx.weekNumber,
        homeTeamId: homeTeam.id,
        homeTeamName: homeTeam.name,
        homeTeamLogoUrl: homeTeam.logoUrl,
        homeTeamHasOfficialLogo: homeTeam.hasOfficialLogo,
        awayTeamId: awayTeam.id,
        awayTeamName: awayTeam.name,
        awayTeamLogoUrl: awayTeam.logoUrl,
        awayTeamHasOfficialLogo: awayTeam.hasOfficialLogo,
        homeScore: completedMatch.homeScore,
        awayScore: completedMatch.awayScore,
        venueId: `venue-${slugify(venueName)}`,
        venueName,
        matchDate: playedDate,
        kickoffTime: fx.kickoffTime || '16:00',
        status: 'FT',
        goalscorersJson: [],
        yellowCardsJson: [],
        redCardsJson: [],
        refereeName: 'NLO Official Match Referee',
        matchSummary: 'Official verified NLO Cup 2026/2027 result from nlo.ng.',
        isVerified: true,
        createdAt: `${playedDate}T18:00:00.000Z`,
      });
    } else {
      const initialStatus = resolveInitialPlayableFixtureStatus(
        fx.matchDate,
        false,
        watReferenceDate
      );
      const isTbc = Boolean(fx.isKickoffTbc || !fx.kickoffTime);
      const matchStatus = initialStatus === 'RESULT_PENDING' ? 'RESULT_PENDING' : 'UPCOMING';

      fixtures.push({
        id: fixtureId,
        seasonId,
        seasonName: '2026/2027 NLO Cup',
        parentZoneId: grp.parentZoneId,
        parentZoneName: grp.parentZoneName,
        groupId: grp.id,
        groupName: grp.name,
        groupCode: grp.code,
        matchNumber: fx.matchNumber,
        weekNumber: fx.weekNumber,
        legHalf: fx.legHalf,
        isBye: false,
        homeTeamId: homeTeam.id,
        homeTeamName: homeTeam.name,
        homeTeamLogoUrl: homeTeam.logoUrl,
        homeTeamHasOfficialLogo: homeTeam.hasOfficialLogo,
        awayTeamId: awayTeam.id,
        awayTeamName: awayTeam.name,
        awayTeamLogoUrl: awayTeam.logoUrl,
        awayTeamHasOfficialLogo: awayTeam.hasOfficialLogo,
        byeTeamId: null,
        byeTeamName: null,
        byeLabel: null,
        venueId: normalizedVenue ? `venue-${slugify(normalizedVenue)}` : null,
        venueName: normalizedVenue,
        matchDate: fx.matchDate,
        kickoffTime: isTbc ? null : fx.kickoffTime,
        isKickoffTbc: isTbc,
        fixtureStatus: initialStatus,
        sourceReferenceImage: fx.sourceReferenceImage,
        sheetNotes: fx.sheetNotes || null,
        match: {
          id: matchId,
          status: matchStatus,
          currentPeriod: 'PRE_MATCH',
          homeScore: 0,
          awayScore: 0,
          currentMinute: 0,
          stoppageTimeAdded: 0,
          isClockRunning: false,
          periodStartedAt: null,
          elapsedSecondsBeforePeriod: 0,
          lockedByRefereeId: null,
          lockedByRefereeName: null,
          assignedRefereeId: null,
          assignedRefereeName: null,
        },
      });
    }
  }

  // Any remaining completed results not matched by sheet number (e.g., extra NC played fixtures)
  for (const res of OFFICIAL_COMPLETED_NLO_RESULTS) {
    if (usedCompletedResults.has(res)) continue;
    usedCompletedResults.add(res);
    const grp = groupByCode.get(res.groupCode)!;
    const homeTeam = ensureTeam(res.groupCode, res.homeTeamName);
    const awayTeam = ensureTeam(res.groupCode, res.awayTeamName);
    const fixtureId = `fixture-${slugify(res.groupCode)}-m${res.matchNumber}-extra`;
    const matchId = `match-${slugify(res.groupCode)}-m${res.matchNumber}-extra`;
    const venueName = normalizeOfficialVenueName(res.venueName) || res.venueName;

    fixtures.push({
      id: fixtureId,
      seasonId,
      seasonName: '2026/2027 NLO Cup',
      parentZoneId: grp.parentZoneId,
      parentZoneName: grp.parentZoneName,
      groupId: grp.id,
      groupName: grp.name,
      groupCode: grp.code,
      matchNumber: res.matchNumber,
      weekNumber: 2,
      legHalf: 'FIRST_HALF',
      isBye: false,
      homeTeamId: homeTeam.id,
      homeTeamName: homeTeam.name,
      homeTeamLogoUrl: homeTeam.logoUrl,
      homeTeamHasOfficialLogo: homeTeam.hasOfficialLogo,
      awayTeamId: awayTeam.id,
      awayTeamName: awayTeam.name,
      awayTeamLogoUrl: awayTeam.logoUrl,
      awayTeamHasOfficialLogo: awayTeam.hasOfficialLogo,
      byeTeamId: null,
      byeTeamName: null,
      byeLabel: null,
      venueId: `venue-${slugify(venueName)}`,
      venueName,
      matchDate: res.playedDate,
      kickoffTime: '16:00',
      isKickoffTbc: false,
      fixtureStatus: 'FT',
      sourceReferenceImage: '/content/images/references/IMG-20261103-WA0055.jpg',
      sheetNotes: 'Official completed match from nlo.ng',
      match: {
        id: matchId,
        status: 'FT',
        currentPeriod: 'FT',
        homeScore: res.homeScore,
        awayScore: res.awayScore,
        currentMinute: 90,
        stoppageTimeAdded: 0,
        isClockRunning: false,
        periodStartedAt: null,
        elapsedSecondsBeforePeriod: 5400,
        lockedByRefereeId: null,
        lockedByRefereeName: null,
        assignedRefereeId: null,
        assignedRefereeName: null,
      },
    });

    historicalMatches.push({
      id: `hist-${fixtureId}`,
      seasonId,
      seasonName: '2026/2027 NLO Cup',
      parentZoneId: grp.parentZoneId,
      parentZoneName: grp.parentZoneName,
      groupId: grp.id,
      groupName: grp.name,
      groupCode: grp.code,
      linkedFixtureId: fixtureId,
      matchNumber: res.matchNumber,
      weekNumber: 2,
      homeTeamId: homeTeam.id,
      homeTeamName: homeTeam.name,
      homeTeamLogoUrl: homeTeam.logoUrl,
      homeTeamHasOfficialLogo: homeTeam.hasOfficialLogo,
      awayTeamId: awayTeam.id,
      awayTeamName: awayTeam.name,
      awayTeamLogoUrl: awayTeam.logoUrl,
      awayTeamHasOfficialLogo: awayTeam.hasOfficialLogo,
      homeScore: res.homeScore,
      awayScore: res.awayScore,
      venueId: `venue-${slugify(venueName)}`,
      venueName,
      matchDate: res.playedDate,
      kickoffTime: '16:00',
      status: 'FT',
      goalscorersJson: [],
      yellowCardsJson: [],
      redCardsJson: [],
      refereeName: 'NLO Official Match Referee',
      matchSummary: 'Official verified NLO Cup 2026/2027 result from nlo.ng.',
      isVerified: true,
      createdAt: `${res.playedDate}T18:00:00.000Z`,
    });
  }

  // Update group counts
  for (const grp of groups) {
    grp.teamsCount = teams.filter((t) => t.groupId === grp.id && t.isActive).length;
    grp.playableFixturesCount = fixtures.filter(
      (f) => f.groupId === grp.id && !f.isBye
    ).length;
  }

  const users: (User & { password?: string })[] = [
    {
      id: 'user-super-admin',
      email: 'admin@nlocup.ng',
      phone: '+2348000000001',
      fullName: 'NLO Cup Super Administrator',
      role: 'SUPER_ADMIN',
      status: 'APPROVED',
      lastLoginAt: new Date().toISOString(),
      createdAt: '2026-10-01T00:00:00.000Z',
      password: 'NloAdmin!2026#Secure',
    },
  ];

  return {
    seasons,
    zones,
    groups,
    teams,
    fixtures,
    historicalMatches,
    eventsByMatchId: {},
    referees: [],
    users,
    auditLogs: [],
    mediaAssets: [],
    notifications: [],
  };
}

function getState(): FallbackState {
  if (cachedState) return cachedState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FallbackState;
      if (parsed && Array.isArray(parsed.seasons) && parsed.fixtures?.length >= 250) {
        cachedState = parsed;
        return cachedState;
      }
    }
  } catch {
    // ignore storage errors
  }
  cachedState = buildInitialState();
  saveState();
  return cachedState;
}

function saveState(): void {
  if (!cachedState) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
  } catch {
    // ignore quota errors
  }
}

function computeAllStandings(state: FallbackState, seasonId: string): StandingRow[] {
  const allRows: StandingRow[] = [];
  for (const grp of state.groups.filter((g) => g.seasonId === seasonId)) {
    const grpTeams = state.teams
      .filter((t) => t.groupId === grp.id && t.isActive)
      .map((t) => ({
        teamId: t.id,
        teamName: t.name,
        teamLogoUrl: t.logoUrl,
        teamHasOfficialLogo: t.hasOfficialLogo,
      }));

    const completedMatches = state.fixtures
      .filter(
        (f) =>
          f.seasonId === seasonId &&
          f.groupId === grp.id &&
          !f.isBye &&
          f.match?.status === 'FT' &&
          f.homeTeamId &&
          f.awayTeamId
      )
      .map((f) => ({
        homeTeamId: f.homeTeamId!,
        awayTeamId: f.awayTeamId!,
        homeScore: f.match!.homeScore,
        awayScore: f.match!.awayScore,
        isCompleted: true,
        isBye: false,
        matchDate: f.matchDate,
      }));

    const calculated = calculateGroupStandings(grpTeams, completedMatches);
    for (const row of calculated) {
      allRows.push({
        ...row,
        seasonId,
        parentZoneId: grp.parentZoneId,
        parentZoneName: grp.parentZoneName,
        groupId: grp.id,
        groupName: grp.name,
        groupCode: grp.code,
      });
    }
  }
  return allRows;
}

export async function handleFallbackApiRequest<T = any>(
  rawPath: string,
  options: RequestInit = {}
): Promise<T> {
  const state = getState();
  const method = (options.method || 'GET').toUpperCase();
  const urlObj = new URL(rawPath.startsWith('http') ? rawPath : `http://localhost${rawPath.startsWith('/') ? rawPath : `/${rawPath}`}`);
  const pathname = urlObj.pathname;
  const query = urlObj.searchParams;
  const body =
    typeof options.body === 'string' && options.body.trim().startsWith('{')
      ? JSON.parse(options.body)
      : {};

  const activeSeasonId =
    query.get('seasonId') ||
    state.seasons.find((s) => s.isActive)?.id ||
    state.seasons[0].id;

  // 1. GET /api/public/seasons
  if (pathname === '/api/public/seasons' && method === 'GET') {
    return { seasons: state.seasons } as T;
  }

  // 2. GET /api/public/zones
  if (pathname === '/api/public/zones' && method === 'GET') {
    const groups = state.groups.filter((g) => g.seasonId === activeSeasonId);
    const zones = state.zones.map((z) => ({
      ...z,
      groups: groups.filter((g) => g.parentZoneId === z.id),
    }));
    return { seasonId: activeSeasonId, zones, groups } as T;
  }

  // 3. GET /api/public/overview
  if (pathname === '/api/public/overview' && method === 'GET') {
    const seasonFixtures = state.fixtures.filter((f) => f.seasonId === activeSeasonId);
    const playable = seasonFixtures.filter((f) => !f.isBye);
    const byes = seasonFixtures.filter((f) => f.isBye);
    const liveMatches = playable.filter((f) =>
      ['LIVE', 'HT', 'SUSPENDED'].includes(f.match?.status || '')
    );
    const upcomingFixtures = playable.filter((f) => f.fixtureStatus === 'UPCOMING');
    const resultPendingFixtures = playable.filter((f) => f.fixtureStatus === 'RESULT_PENDING');
    const completedMatches = playable.filter((f) => f.fixtureStatus === 'FT');
    const totalGoals = completedMatches.reduce(
      (sum, f) => sum + (f.match?.homeScore || 0) + (f.match?.awayScore || 0),
      0
    );
    const standingsPreview = computeAllStandings(state, activeSeasonId);

    return {
      branding: {
        nloLogoUrl: NLO_OFFICIAL_LOGO_URL,
        nffCrestUrl: NFF_OFFICIAL_CREST_URL,
        neutralTeamBadgeUrl: NEUTRAL_TEAM_PLACEHOLDER_URL,
        timezone: 'Africa/Lagos',
      },
      seasonId: activeSeasonId,
      statistics: {
        totalTeams: state.teams.length,
        totalParentZones: state.zones.length,
        totalGroups: state.groups.length,
        totalVenues: 23,
        playableFixtures: playable.length,
        byeEntries: byes.length,
        liveMatches: liveMatches.length,
        upcomingMatches: upcomingFixtures.length,
        resultPendingMatches: resultPendingFixtures.length,
        completedMatches: completedMatches.length,
        totalGoals,
      },
      liveMatches,
      upcomingFixtures: upcomingFixtures.slice(0, 16),
      resultPendingFixtures: resultPendingFixtures.slice(0, 12),
      recentCompletedMatches: [...completedMatches]
        .sort((a, b) => (b.matchDate || '').localeCompare(a.matchDate || ''))
        .slice(0, 12),
      recentHistoricalResults: [...state.historicalMatches]
        .sort((a, b) => (b.matchDate || '').localeCompare(a.matchDate || ''))
        .slice(0, 12),
      latestMatchUpdates: [],
      standingsPreview,
      featuredTeams: state.teams.slice(0, 12),
    } as T;
  }

  // 4. GET /api/public/fixtures
  if (pathname === '/api/public/fixtures' && method === 'GET') {
    const parentZoneId = query.get('parentZoneId') || undefined;
    const groupId = query.get('groupId') || undefined;
    const weekNumber = query.get('weekNumber') ? Number(query.get('weekNumber')) : undefined;
    const status = query.get('status') || undefined;
    const date = query.get('date') || undefined;
    const teamId = query.get('teamId') || undefined;
    const isKickoffTbc = query.get('isKickoffTbc') || undefined;
    const includeByes = query.get('includeByes') !== 'false';
    const search = query.get('search')?.trim().toLowerCase();

    const filtered = state.fixtures.filter((f) => {
      if (f.seasonId !== activeSeasonId) return false;
      if (!includeByes && f.isBye) return false;
      if (parentZoneId && f.parentZoneId !== parentZoneId) return false;
      if (groupId && f.groupId !== groupId) return false;
      if (weekNumber !== undefined && !Number.isNaN(weekNumber) && f.weekNumber !== weekNumber)
        return false;
      if (status) {
        if (status === 'LIVE_ALL') {
          if (f.isBye || !['LIVE', 'HT', 'SUSPENDED'].includes(f.match?.status || '')) return false;
        } else if (f.fixtureStatus !== status) {
          return false;
        }
      }
      if (date && f.matchDate !== date) return false;
      if (
        teamId &&
        f.homeTeamId !== teamId &&
        f.awayTeamId !== teamId &&
        f.byeTeamId !== teamId
      )
        return false;
      if (isKickoffTbc === 'true' && !f.isKickoffTbc) return false;
      if (search) {
        const hay = `${f.homeTeamName || ''} ${f.awayTeamName || ''} ${f.venueName || ''} ${f.groupName || ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    return {
      seasonId: activeSeasonId,
      total: filtered.length,
      fixtures: filtered,
    } as T;
  }

  // 5. GET /api/public/results
  if (pathname === '/api/public/results' && method === 'GET') {
    const parentZoneId = query.get('parentZoneId') || undefined;
    const groupId = query.get('groupId') || undefined;
    const teamId = query.get('teamId') || undefined;
    const search = query.get('search')?.trim().toLowerCase();

    const historical = state.historicalMatches
      .filter((h) => {
        if (h.seasonId !== activeSeasonId) return false;
        if (parentZoneId && h.parentZoneId !== parentZoneId) return false;
        if (groupId && h.groupId !== groupId) return false;
        if (teamId && h.homeTeamId !== teamId && h.awayTeamId !== teamId) return false;
        if (search) {
          const hay = `${h.homeTeamName} ${h.awayTeamName} ${h.venueName || ''} ${h.groupName}`.toLowerCase();
          if (!hay.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => (b.matchDate || '').localeCompare(a.matchDate || ''));

    const linkedIds = new Set(historical.map((h) => h.linkedFixtureId).filter(Boolean));
    const liveCompletedMatches = state.fixtures.filter((f) => {
      if (f.seasonId !== activeSeasonId || f.isBye || f.match?.status !== 'FT') return false;
      if (linkedIds.has(f.id)) return false;
      if (parentZoneId && f.parentZoneId !== parentZoneId) return false;
      if (groupId && f.groupId !== groupId) return false;
      if (teamId && f.homeTeamId !== teamId && f.awayTeamId !== teamId) return false;
      return true;
    });

    return {
      seasonId: activeSeasonId,
      historicalMatches: historical,
      liveCompletedMatches,
      totalCount: historical.length + liveCompletedMatches.length,
    } as T;
  }

  // 6. GET /api/public/standings
  if (pathname === '/api/public/standings' && method === 'GET') {
    const parentZoneId = query.get('parentZoneId') || undefined;
    const groupId = query.get('groupId') || undefined;
    const allStandings = computeAllStandings(state, activeSeasonId).filter((s) => {
      if (parentZoneId && s.parentZoneId !== parentZoneId) return false;
      if (groupId && s.groupId !== groupId) return false;
      return true;
    });
    return {
      seasonId: activeSeasonId,
      standings: allStandings,
    } as T;
  }

  // 7. GET /api/public/teams
  if (pathname === '/api/public/teams' && method === 'GET') {
    const parentZoneId = query.get('parentZoneId') || undefined;
    const groupId = query.get('groupId') || undefined;
    const search = query.get('search')?.trim().toLowerCase();
    const teams = state.teams.filter((t) => {
      if (!t.isActive) return false;
      if (parentZoneId && t.parentZoneId !== parentZoneId) return false;
      if (groupId && t.groupId !== groupId) return false;
      if (search) {
        const hay = `${t.name} ${t.shortName} ${t.groupName || ''}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
    return { total: teams.length, teams } as T;
  }

  // 8. GET /api/public/teams/:id
  if (pathname.startsWith('/api/public/teams/') && method === 'GET') {
    const idOrSlug = decodeURIComponent(pathname.replace('/api/public/teams/', ''));
    const team = state.teams.find((t) => t.id === idOrSlug || t.slug === idOrSlug);
    if (!team) throw new Error('Team not found.');
    const fixtures = state.fixtures.filter(
      (f) => f.homeTeamId === team.id || f.awayTeamId === team.id || f.byeTeamId === team.id
    );
    const allStandings = computeAllStandings(state, activeSeasonId);
    const standing = allStandings.find((s) => s.teamId === team.id) || null;
    const historicalMatches = state.historicalMatches.filter(
      (h) => h.homeTeamId === team.id || h.awayTeamId === team.id
    );
    return { team, standing, fixtures, historicalMatches } as T;
  }

  // 9. GET /api/public/matches/:id
  if (pathname.startsWith('/api/public/matches/') && method === 'GET') {
    const id = decodeURIComponent(pathname.replace('/api/public/matches/', ''));
    const fixture = state.fixtures.find((f) => f.id === id || f.match?.id === id);
    if (!fixture) throw new Error('Match not found.');
    const events = state.eventsByMatchId[fixture.match?.id || fixture.id] || [];
    const groupStandings = computeAllStandings(state, fixture.seasonId).filter(
      (s) => s.groupId === fixture.groupId
    );
    return {
      match: fixture,
      events,
      groupStandings,
    } as T;
  }

  // 10. Auth Endpoints (/api/auth/login, /api/auth/register-referee, /api/auth/me)
  if (pathname === '/api/auth/login' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const found = state.users.find((u) => u.email.toLowerCase() === email);
    if (!found || (found.password && found.password !== password)) {
      throw new Error('Invalid email or password.');
    }
    const referee = state.referees.find((r) => r.userId === found.id) || null;
    return {
      token: `fallback-jwt-${found.id}`,
      user: found,
      referee,
    } as T;
  }

  if (pathname === '/api/auth/register-referee' && method === 'POST') {
    const userId = `user-ref-${Date.now()}`;
    const refId = `ref-${Date.now()}`;
    const grp =
      state.groups.find((g) => g.id === body.registeredGroupId) || state.groups[0];
    const newUser: User & { password?: string } = {
      id: userId,
      email: String(body.email || '').toLowerCase(),
      phone: body.phone || '+2348000000000',
      fullName: body.fullName || 'NLO Match Referee',
      role: 'REFEREE',
      status: 'PENDING',
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      password: body.password || 'Referee123!',
    };
    const newReferee: RefereeProfile = {
      id: refId,
      userId,
      email: newUser.email,
      phone: newUser.phone,
      fullName: newUser.fullName,
      status: 'PENDING',
      refereeIdNumber: `NLO-REF-2026-${String(state.referees.length + 1).padStart(4, '0')}`,
      registeredGroupId: grp.id,
      registeredGroupName: grp.name,
      registeredGroupCode: grp.code,
      parentZoneId: grp.parentZoneId,
      parentZoneName: grp.parentZoneName,
      stateOfResidence: body.stateOfResidence || 'Nigeria',
      yearsExperience: Number(body.yearsExperience || 3),
      badgeLevel: body.badgeLevel || 'Grade 1',
      allowedGroupIds: [grp.id],
      allowedGroups: [{ id: grp.id, name: grp.name, code: grp.code }],
      approvedAt: null,
      createdAt: new Date().toISOString(),
    };
    state.users.push(newUser);
    state.referees.push(newReferee);
    saveState();
    return {
      message: 'Referee registration submitted and pending Super Admin approval.',
      referee: newReferee,
    } as T;
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    const authHeader = new Headers(options.headers || {}).get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const userId = token.replace(/^fallback-jwt-/, '');
    const user = state.users.find((u) => u.id === userId) || state.users[0];
    const referee = state.referees.find((r) => r.userId === user.id) || null;
    return {
      user,
      referee,
      notifications: state.notifications,
    } as T;
  }

  // 11. Admin Endpoints
  if (pathname === '/api/admin/overview' && method === 'GET') {
    const overview = await handleFallbackApiRequest<any>('/api/public/overview');
    return {
      ...overview,
      pendingRefereesCount: state.referees.filter((r) => r.status === 'PENDING').length,
      approvedRefereesCount: state.referees.filter((r) => r.status === 'APPROVED').length,
    } as T;
  }

  if (pathname === '/api/admin/referees' && method === 'GET') {
    return { referees: state.referees } as T;
  }

  if (pathname === '/api/admin/fixtures' && method === 'GET') {
    return { fixtures: state.fixtures } as T;
  }

  if (pathname === '/api/admin/historical-matches' && method === 'GET') {
    return { historicalMatches: state.historicalMatches } as T;
  }

  if (pathname === '/api/admin/media' && method === 'GET') {
    return { mediaAssets: state.mediaAssets } as T;
  }

  if (pathname === '/api/admin/audit-logs' && method === 'GET') {
    return { auditLogs: state.auditLogs } as T;
  }

  return {} as T;
}

