import type {
  AccountStatus,
  FixtureStatus,
  MatchEventType,
  MatchPeriod,
  MatchStatus,
  MediaCategory,
  NotificationType,
  TieBreakerRule,
  UserRole,
} from '../constants/index.ts';

export interface Season {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  timezone: string;
  isActive: boolean;
  isArchived: boolean;
  pointsPerWin: number;
  pointsPerDraw: number;
  pointsPerLoss: number;
  tieBreakerRules: TieBreakerRule[];
  createdAt: string;
  updatedAt: string;
}

export interface ParentZone {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CompetitionGroup {
  id: string;
  seasonId: string;
  parentZoneId: string;
  parentZoneName?: string;
  parentZoneCode?: string;
  name: string;
  code: string;
  format: string;
  hasByeSlot: boolean;
  isActive: boolean;
  referenceImages: string[];
  createdAt: string;
}

export interface Venue {
  id: string;
  name: string;
  normalizedName: string;
  parentZoneId: string;
  parentZoneName?: string;
  city: string | null;
  state: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  parentZoneId: string;
  parentZoneName?: string;
  groupId: string;
  groupName?: string;
  groupCode?: string;
  homeVenueId: string | null;
  homeVenueName?: string | null;
  logoUrl: string | null;
  hasOfficialLogo: boolean;
  teamPhotoUrl: string | null;
  promoVideoUrl: string | null;
  foundedYear: number | null;
  headCoach: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface RefereeProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: AccountStatus;
  refereeIdNumber: string;
  parentZoneId: string;
  parentZoneName: string;
  primaryGroupId: string;
  primaryGroupName: string;
  primaryGroupCode: string;
  allowedGroupIds: string[];
  allowedGroupNames: string[];
  photoUrl: string | null;
  experienceYears: number | null;
  matchesOfficiatedCount: number;
  approvedByUserId: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface FixtureView {
  id: string;
  seasonId: string;
  seasonName?: string;
  parentZoneId: string;
  parentZoneName: string;
  groupId: string;
  groupName: string;
  groupCode: string;
  matchNumber: number;
  weekNumber: number;
  legHalf: 'FIRST_HALF' | 'SECOND_HALF';
  isBye: boolean;
  homeTeamId: string | null;
  homeTeamName: string;
  homeTeamLogoUrl: string | null;
  homeTeamHasOfficialLogo: boolean;
  awayTeamId: string | null;
  awayTeamName: string;
  awayTeamLogoUrl: string | null;
  awayTeamHasOfficialLogo: boolean;
  byeTeamId: string | null;
  byeTeamName: string | null;
  byeLabel: string | null;
  venueId: string | null;
  venueName: string | null;
  matchDate: string | null;
  kickoffTime: string | null;
  isKickoffTbc: boolean;
  fixtureStatus: FixtureStatus;
  sourceReferenceImage: string;
  sheetNotes: string | null;
  // Linked Playable Match Live State (null when isBye === true)
  matchId: string | null;
  matchStatus: MatchStatus | null;
  currentPeriod: MatchPeriod | null;
  homeScore: number | null;
  awayScore: number | null;
  currentMinute: number | null;
  stoppageTimeAdded: number | null;
  periodStartedAt: string | null;
  elapsedSecondsBeforePeriod: number | null;
  isClockRunning: boolean | null;
  lockedByRefereeId: string | null;
  lockedByRefereeName: string | null;
  lockedByRefereeNumber: string | null;
  assignedRefereeId: string | null;
  assignedRefereeName: string | null;
  stats?: MatchStats;
}

export interface MatchStats {
  homePossession: number;
  awayPossession: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homeCorners: number;
  awayCorners: number;
  homeFouls: number;
  awayFouls: number;
  homeOffsides: number;
  awayOffsides: number;
  homeYellowCards: number;
  awayYellowCards: number;
  homeRedCards: number;
  awayRedCards: number;
}

export interface MatchEventSnapshot {
  version: number;
  eventType: MatchEventType;
  teamId: string | null;
  playerName: string | null;
  playerNumber: number | null;
  secondaryPlayerName: string | null;
  secondaryPlayerNumber: number | null;
  matchMinute: number;
  stoppageMinute: number | null;
  reasonOrDescription: string | null;
  updatedByUserId: string;
  updatedAt: string;
  correctionReason: string;
}

export interface MatchEventRecord {
  id: string;
  matchId: string;
  idempotencyKey: string;
  eventType: MatchEventType;
  teamId: string | null;
  teamName: string | null;
  playerName: string | null;
  playerNumber: number | null;
  secondaryPlayerName: string | null;
  secondaryPlayerNumber: number | null;
  matchMinute: number;
  stoppageMinute: number | null;
  extraMinute?: number | null;
  period: MatchPeriod;
  reasonOrDescription: string | null;
  description?: string | null;
  isDeleted: boolean;
  version: number;
  previousSnapshots: MatchEventSnapshot[];
  recordedByUserId: string;
  recordedByName?: string;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MatchEventView = MatchEventRecord;

export interface HistoricalGoalscorer {
  teamId: string;
  teamName: string;
  playerName: string;
  playerNumber?: number | null;
  minute: number;
  goalType: 'GOAL' | 'PENALTY_GOAL' | 'OWN_GOAL';
}

export interface HistoricalMatchRecord {
  id: string;
  seasonId: string;
  seasonName: string;
  parentZoneId: string;
  parentZoneName: string;
  groupId: string;
  groupName: string;
  groupCode: string;
  linkedFixtureId: string | null;
  matchNumber: number | null;
  weekNumber: number | null;
  matchDate: string;
  kickoffTime: string | null;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogoUrl: string | null;
  homeTeamHasOfficialLogo: boolean;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogoUrl: string | null;
  awayTeamHasOfficialLogo: boolean;
  homeScore: number;
  awayScore: number;
  venueName: string;
  status: 'FT' | 'POSTPONED' | 'CANCELLED';
  goalscorers: HistoricalGoalscorer[];
  goalscorersSummary?: string | null;
  additionalInfo: string | null;
  notes?: string | null;
  enteredByAdminId: string;
  enteredByAdminName?: string;
  createdAt: string;
  updatedAt: string;
}

export type HistoricalMatchView = HistoricalMatchRecord;

export interface StandingRow {
  id?: string;
  seasonId: string;
  parentZoneId: string;
  groupId: string;
  groupName?: string;
  teamId: string;
  teamName: string;
  teamLogoUrl: string | null;
  teamHasOfficialLogo: boolean;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  formLast5: string[];
  updatedAt?: string;
}

export interface MediaAssetRecord {
  id: string;
  category: MediaCategory;
  entityType: string | null;
  entityId: string | null;
  title: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageRelativePath: string;
  publicUrl: string;
  uploadedByUserId: string | null;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  recipientUserId: string | null;
  recipientRole: UserRole | 'PUBLIC' | null;
  groupId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export type AuditLogEntry = AuditLogRecord;
