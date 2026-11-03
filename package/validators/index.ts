import { z } from 'zod';
import {
  ACCOUNT_STATUSES,
  FIXTURE_STATUSES,
  MATCH_EVENT_TYPES,
  MATCH_PERIODS,
  MATCH_STATUSES,
  MEDIA_CATEGORIES,
  TIE_BREAKER_RULES,
} from '../constants/index.ts';

export const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const refereeRegistrationSchema = z.object({
  fullName: z.string().trim().min(3, 'Full name must be at least 3 characters.').max(150),
  email: z.string().trim().email('Please enter a valid email address.'),
  phone: z.string().trim().min(7, 'Please enter a valid phone number.').max(30),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(100),
  refereeIdNumber: z
    .string()
    .trim()
    .min(3, 'Referee ID Number is required (e.g., NLO-REF-2026-001).')
    .max(64),
  primaryGroupId: z.string().uuid('Please select an official NLO Cup Competition Group/Centre.'),
  experienceYears: z.coerce.number().int().min(0).max(50).optional().default(1),
  photoUrl: z.string().trim().optional().nullable(),
});

export const matchClockControlSchema = z.object({
  action: z.enum([
    'START_MATCH',
    'PAUSE_MATCH',
    'RESUME_MATCH',
    'START_FIRST_HALF',
    'END_FIRST_HALF',
    'RECORD_HALF_TIME',
    'START_SECOND_HALF',
    'RECORD_STOPPAGE_TIME',
    'END_SECOND_HALF',
    'START_EXTRA_TIME_1',
    'END_EXTRA_TIME_1',
    'START_EXTRA_TIME_2',
    'END_EXTRA_TIME_2',
    'START_PENALTIES',
    'RECORD_FULL_TIME',
    'SUSPEND_MATCH',
    'POSTPONE_MATCH',
    'CANCEL_MATCH',
  ]),
  stoppageTimeMinutes: z.coerce.number().int().min(0).max(30).optional(),
  currentMinuteOverride: z.coerce.number().int().min(0).max(150).optional(),
  reason: z.string().trim().max(500).optional(),
});

export const createMatchEventSchema = z.object({
  idempotencyKey: z.string().uuid('Valid UUID idempotency key is required.'),
  eventType: z.enum(MATCH_EVENT_TYPES),
  teamId: z.string().uuid().nullable().optional(),
  playerName: z.string().trim().min(1, 'Player name is required.').max(150),
  playerNumber: z.coerce.number().int().min(1).max(99).nullable().optional(),
  secondaryPlayerName: z.string().trim().max(150).nullable().optional(),
  secondaryPlayerNumber: z.coerce.number().int().min(1).max(99).nullable().optional(),
  matchMinute: z.coerce.number().int().min(1).max(150),
  stoppageMinute: z.coerce.number().int().min(1).max(30).nullable().optional(),
  period: z.enum(MATCH_PERIODS).optional(),
  reasonOrDescription: z.string().trim().max(500).nullable().optional(),
});

export const correctMatchEventSchema = z.object({
  eventType: z.enum(MATCH_EVENT_TYPES).optional(),
  teamId: z.string().uuid().nullable().optional(),
  playerName: z.string().trim().min(1).max(150).optional(),
  playerNumber: z.coerce.number().int().min(1).max(99).nullable().optional(),
  secondaryPlayerName: z.string().trim().max(150).nullable().optional(),
  secondaryPlayerNumber: z.coerce.number().int().min(1).max(99).nullable().optional(),
  matchMinute: z.coerce.number().int().min(1).max(150).optional(),
  stoppageMinute: z.coerce.number().int().min(1).max(30).nullable().optional(),
  reasonOrDescription: z.string().trim().max(500).nullable().optional(),
  isDeleted: z.boolean().optional(),
  correctionReason: z
    .string()
    .trim()
    .min(3, 'A clear audit reason is required when correcting or removing a match event.')
    .max(500),
});

export const historicalMatchSchema = z.object({
  seasonId: z.string().uuid(),
  groupId: z.string().uuid(),
  linkedFixtureId: z.string().uuid().nullable().optional(),
  matchNumber: z.coerce.number().int().min(1).max(500).nullable().optional(),
  weekNumber: z.coerce.number().int().min(1).max(50).nullable().optional(),
  matchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'),
  kickoffTime: z.string().trim().max(20).optional().default('16:00'),
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(50),
  awayScore: z.coerce.number().int().min(0).max(50),
  venueName: z.string().trim().min(2, 'Venue name is required.').max(160),
  status: z.enum(['FT', 'POSTPONED', 'CANCELLED']).default('FT'),
  goalscorers: z
    .array(
      z.object({
        teamId: z.string().uuid(),
        teamName: z.string().trim(),
        playerName: z.string().trim().min(1),
        playerNumber: z.coerce.number().int().min(1).max(99).nullable().optional(),
        minute: z.coerce.number().int().min(1).max(150),
        goalType: z.enum(['GOAL', 'PENALTY_GOAL', 'OWN_GOAL']).default('GOAL'),
      })
    )
    .optional()
    .default([]),
  additionalInfo: z.string().trim().max(1000).nullable().optional(),
  auditReason: z.string().trim().max(500).optional(),
});

export const fixtureCreateOrUpdateSchema = z.object({
  seasonId: z.string().uuid(),
  groupId: z.string().uuid(),
  matchNumber: z.coerce.number().int().min(1).max(500),
  weekNumber: z.coerce.number().int().min(1).max(50),
  legHalf: z.enum(['FIRST_HALF', 'SECOND_HALF']).default('FIRST_HALF'),
  homeTeamId: z.string().uuid(),
  awayTeamId: z.string().uuid(),
  venueId: z.string().uuid().nullable().optional(),
  venueName: z.string().trim().max(160).optional(),
  matchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Match date must be YYYY-MM-DD'),
  kickoffTime: z.string().trim().min(1).max(16),
  fixtureStatus: z.enum(FIXTURE_STATUSES).optional(),
  assignedRefereeId: z.string().uuid().nullable().optional(),
  sheetNotes: z.string().trim().max(500).nullable().optional(),
});

export const teamCreateOrUpdateSchema = z.object({
  name: z.string().trim().min(2).max(150),
  shortName: z.string().trim().min(2).max(50).optional(),
  groupId: z.string().uuid(),
  homeVenueId: z.string().uuid().nullable().optional(),
  logoUrl: z.string().trim().nullable().optional(),
  hasOfficialLogo: z.boolean().optional(),
  teamPhotoUrl: z.string().trim().nullable().optional(),
  promoVideoUrl: z.string().trim().nullable().optional(),
  foundedYear: z.coerce.number().int().min(1900).max(2030).nullable().optional(),
  headCoach: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().optional().default(true),
});

export const seasonCreateOrUpdateSchema = z.object({
  name: z.string().trim().min(4).max(120),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  pointsPerWin: z.coerce.number().int().min(1).max(10).optional().default(3),
  pointsPerDraw: z.coerce.number().int().min(0).max(5).optional().default(1),
  pointsPerLoss: z.coerce.number().int().min(0).max(5).optional().default(0),
  tieBreakerRules: z.array(z.enum(TIE_BREAKER_RULES)).optional(),
});

export const refereeStatusUpdateSchema = z.object({
  status: z.enum(ACCOUNT_STATUSES),
  primaryGroupId: z.string().uuid().optional(),
  additionalGroupIds: z.array(z.string().uuid()).optional(),
  reason: z.string().trim().max(500).optional(),
});

export const mediaMetadataSchema = z.object({
  category: z.enum(MEDIA_CATEGORIES),
  entityType: z.string().trim().max(32).nullable().optional(),
  entityId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200),
});

