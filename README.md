# `@nlo-cup/frontend` — Public Website, Mobile Referee Portal & Super Admin Command Centre

React 18 + TypeScript + Vite + Tailwind CSS + Socket.IO Client application for **NLO Cup Live**.

## Key Routes

- **Public Website**:
  - `/` (`HomePage.tsx`): Broadcast hero, featured live matches, upcoming fixtures, recent results & `RESULT_PENDING` past fixtures, standings preview, event ticker, 4 Parent Zones & 7 Centres, and featured clubs.
  - `/live` (`LiveScoresPage.tsx`): Zero-refresh live scoreboard filterable by Season, Zone, Centre, Status, Date, and Team.
  - `/fixtures` (`FixturesPage.tsx`): All 252 playable fixtures + 10 explicit weekly `BYE` rows + `TBC` kickoff filter.
  - `/results` (`ResultsPage.tsx`): Verified `FT` results archive separated from unconfirmed `RESULT_PENDING` fixtures.
  - `/standings` (`StandingsPage.tsx`): All 7 Group/Centre tables with tie-breaker legend.
  - `/teams` & `/teams/:id` (`TeamsPage.tsx`, `TeamDetailPage.tsx`): All 46 clubs with official logo or clearly marked neutral placeholder shield.
  - `/regions` & `/about` (`RegionsPage.tsx`, `AboutPage.tsx`): Interactive explorer for the 4 Parent Zones, 7 Centres, and 18 official Secretariat reference sheets.
  - `/matches/:id` (`MatchDetailPage.tsx`): Dedicated live match center with scoreboard, chronological timeline, statistics, and officials.
- **Mobile-First Referee Portal**:
  - `/referee/register` & `/referee/login` (`RefereeAuthPages.tsx`)
  - `/referee` (`RefereeDashboardPage.tsx`)
  - `/referee/matches/:id` (`LiveMatchControlCentrePage.tsx`)
- **Super Admin Command Centre**:
  - `/admin/login` (`AdminLoginPage.tsx`)
  - `/admin` (`AdminDashboardPage.tsx`)

