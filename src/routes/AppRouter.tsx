import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from '../context/AppContext.tsx';
import { PublicLayout } from '../layouts/PublicLayout.tsx';
import { HomePage } from '../pages/public/HomePage.tsx';
import { LiveScoresPage } from '../pages/public/LiveScoresPage.tsx';
import { FixturesPage } from '../pages/public/FixturesPage.tsx';
import { ResultsPage } from '../pages/public/ResultsPage.tsx';
import { StandingsPage } from '../pages/public/StandingsPage.tsx';
import { TeamsPage } from '../pages/public/TeamsPage.tsx';
import { TeamDetailPage } from '../pages/public/TeamDetailPage.tsx';
import { RegionsPage } from '../pages/public/RegionsPage.tsx';
import { AboutPage } from '../pages/public/AboutPage.tsx';
import { MatchDetailPage } from '../pages/public/MatchDetailPage.tsx';
import {
  RefereeLoginPage,
  RefereeRegisterPage,
} from '../pages/referee/RefereeAuthPages.tsx';
import { RefereeDashboardPage } from '../pages/referee/RefereeDashboardPage.tsx';
import { LiveMatchControlCentrePage } from '../pages/referee/LiveMatchControlCentrePage.tsx';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage.tsx';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.tsx';

export const AppRouter: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            {/* Public Website Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/live" element={<LiveScoresPage />} />
            <Route path="/fixtures" element={<FixturesPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/standings" element={<StandingsPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:id" element={<TeamDetailPage />} />
            <Route path="/regions" element={<RegionsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/matches/:id" element={<MatchDetailPage />} />

            {/* Referee Portal Routes */}
            <Route path="/referee" element={<RefereeDashboardPage />} />
            <Route path="/referee/login" element={<RefereeLoginPage />} />
            <Route path="/referee/register" element={<RefereeRegisterPage />} />
            <Route path="/referee/matches/:id" element={<LiveMatchControlCentrePage />} />

            {/* Super Admin Portal Routes */}
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

