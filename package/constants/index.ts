export const DEFAULT_TIMEZONE = 'Africa/Lagos' as const;
export const KICKOFF_TBC = 'TBC' as const;

export const MATCH_STATUSES = [
  'LIVE',
  'HT',
  'FT',
  'UPCOMING',
  'RESULT_PENDING',
  'POSTPONED',
  'CANCELLED',
  'SUSPENDED',
] as const;

export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const FIXTURE_STATUSES = [...MATCH_STATUSES, 'BYE'] as const;
export type FixtureStatus = (typeof FIXTURE_STATUSES)[number];

export const MATCH_PERIODS = [
  'PRE_MATCH',
  'FIRST_HALF',
  'HALF_TIME',
  'SECOND_HALF',
  'EXTRA_TIME_1',
  'EXTRA_TIME_2',
  'PENALTIES',
  'FULL_TIME',
] as const;

export type MatchPeriod = (typeof MATCH_PERIODS)[number];

export const MATCH_EVENT_TYPES = [
  'GOAL',
  'OWN_GOAL',
  'PENALTY_GOAL',
  'MISSED_PENALTY',
  'PENALTY_MISSED',
  'YELLOW_CARD',
  'SECOND_YELLOW_RED',
  'RED_CARD',
  'SUBSTITUTION',
  'INJURY',
  'STOPPAGE_TIME',
  'PERIOD_START',
  'PERIOD_END',
  'INCIDENT',
] as const;

export type MatchEventType = (typeof MATCH_EVENT_TYPES)[number];

export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'REFEREE'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const TIE_BREAKER_RULES = [
  'POINTS',
  'GOAL_DIFFERENCE',
  'GOALS_FOR',
  'HEAD_TO_HEAD',
  'WINS',
] as const;

export type TieBreakerRule = (typeof TIE_BREAKER_RULES)[number];

export const MEDIA_CATEGORIES = [
  'TEAM_LOGO',
  'TEAM_PHOTO',
  'PLAYER_PHOTO',
  'REFEREE_PHOTO',
  'VENUE_PHOTO',
  'COMPETITION_LOGO',
  'COMPETITION_BANNER',
  'BANNER',
  'MATCH_HIGHLIGHT_VIDEO',
  'MATCH_HIGHLIGHT',
  'PROMOTIONAL_VIDEO',
  'REFERENCE_SHEET',
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const NOTIFICATION_TYPES = [
  'REFEREE_REGISTERED',
  'REFEREE_APPROVED',
  'REFEREE_REJECTED',
  'REFEREE_SUSPENDED',
  'MATCH_ASSIGNED',
  'MATCH_STARTING',
  'GOAL_SCORED',
  'HALF_TIME',
  'FULL_TIME',
  'MATCH_POSTPONED',
  'MATCH_CANCELLED',
  'HISTORICAL_RESULT_PUBLISHED',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface OfficialParentZoneDef {
  code: 'SW' | 'NC' | 'NW' | 'SESS';
  name: string;
  description: string;
}

export const OFFICIAL_PARENT_ZONES: OfficialParentZoneDef[] = [
  {
    code: 'SW',
    name: 'Southwest Zone',
    description: 'Official NLO Cup Southwest Geopolitical Zone encompassing Group A, Centre B, Centre C, and Group D.',
  },
  {
    code: 'NC',
    name: 'North Central Zone',
    description: 'Official NLO Cup North Central Geopolitical Zone (Abuja, Plateau, Kogi, Nasarawa, and environs).',
  },
  {
    code: 'NW',
    name: 'Northwest Zone',
    description: 'Official NLO Cup Northwest Geopolitical Zone (Kano, Kaduna/Zaria, and environs).',
  },
  {
    code: 'SESS',
    name: 'South East & South South Zone',
    description: 'Official NLO Cup Combined South East & South South Geopolitical Zone (Abia, Akwa Ibom, Enugu, Imo, and environs).',
  },
];

export interface OfficialCompetitionGroupDef {
  code: 'SW-A' | 'SW-B' | 'SW-C' | 'SW-D' | 'NC' | 'NW' | 'SESS';
  name: string;
  parentZoneCode: 'SW' | 'NC' | 'NW' | 'SESS';
  hasByeSlot: boolean;
  referenceImages: string[];
}

export const OFFICIAL_COMPETITION_GROUPS: OfficialCompetitionGroupDef[] = [
  {
    code: 'SW-A',
    name: 'Southwest Zone - Group A',
    parentZoneCode: 'SW',
    hasByeSlot: false,
    referenceImages: ['IMG-20261103-WA0042.jpg', 'IMG-20261103-WA0048.jpg'],
  },
  {
    code: 'SW-B',
    name: 'Southwest Zone - Centre B',
    parentZoneCode: 'SW',
    hasByeSlot: false,
    referenceImages: ['IMG-20261103-WA0046.jpg', 'IMG-20261103-WA0044.jpg'],
  },
  {
    code: 'SW-C',
    name: 'Southwest Zone - Centre C',
    parentZoneCode: 'SW',
    hasByeSlot: false,
    referenceImages: ['IMG-20261103-WA0050.jpg', 'IMG-20261103-WA0051.jpg', 'IMG-20261103-WA0043.jpg'],
  },
  {
    code: 'SW-D',
    name: 'South West Group D',
    parentZoneCode: 'SW',
    hasByeSlot: false,
    referenceImages: ['IMG-20261103-WA0053.jpg', 'IMG-20261103-WA0047.jpg'],
  },
  {
    code: 'NC',
    name: 'North Central Zone',
    parentZoneCode: 'NC',
    hasByeSlot: true,
    referenceImages: [
      'IMG-20261103-WA0054.jpg',
      'IMG-20261103-WA0057.jpg',
      'IMG-20261103-WA0049.jpg',
      'IMG-20261103-WA0045.jpg',
    ],
  },
  {
    code: 'NW',
    name: 'Northwest Zone',
    parentZoneCode: 'NW',
    hasByeSlot: true,
    referenceImages: ['IMG-20261103-WA0058.jpg', 'IMG-20261103-WA0052.jpg'],
  },
  {
    code: 'SESS',
    name: 'South East & South South Zone',
    parentZoneCode: 'SESS',
    hasByeSlot: false,
    referenceImages: ['IMG-20261103-WA0059.jpg', 'IMG-20261103-WA0055.jpg', 'IMG-20261103-WA0056.jpg'],
  },
];

export const NEUTRAL_TEAM_PLACEHOLDER_URL = '/content/images/logos/neutral-team-placeholder.svg';
export const NLO_OFFICIAL_LOGO_URL = '/content/images/logos/nlo-official-logo.png';
export const NFF_OFFICIAL_CREST_URL = '/content/images/logos/nff-official-crest.png';

export const OFFICIAL_FIXTURE_SHEETS = [
  'IMG-20261103-WA0042.jpg',
  'IMG-20261103-WA0043.jpg',
  'IMG-20261103-WA0044.jpg',
  'IMG-20261103-WA0045.jpg',
  'IMG-20261103-WA0046.jpg',
  'IMG-20261103-WA0047.jpg',
  'IMG-20261103-WA0048.jpg',
  'IMG-20261103-WA0049.jpg',
  'IMG-20261103-WA0050.jpg',
  'IMG-20261103-WA0051.jpg',
  'IMG-20261103-WA0052.jpg',
  'IMG-20261103-WA0053.jpg',
  'IMG-20261103-WA0054.jpg',
  'IMG-20261103-WA0055.jpg',
  'IMG-20261103-WA0056.jpg',
  'IMG-20261103-WA0057.jpg',
  'IMG-20261103-WA0058.jpg',
  'IMG-20261103-WA0059.jpg',
] as const;
