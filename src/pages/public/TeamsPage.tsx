import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Filter, MapPin, Search, Shield, Users } from 'lucide-react';
import type { Team } from '@nlo-cup/package';
import { useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../services/api.ts';
import { TeamCrest } from '../../components/SharedComponents.tsx';

export const TeamsPage: React.FC = () => {
  const { zones, groups, lastRealtimeTick } = useApp();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [parentZoneId, setParentZoneId] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredGroups = parentZoneId
    ? groups.filter((g) => g.parentZoneId === parentZoneId)
    : groups;

  useEffect(() => {
    let active = true;
    const loadTeams = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (parentZoneId) params.set('parentZoneId', parentZoneId);
        if (groupId) params.set('groupId', groupId);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());

        const res = await apiRequest<{ teams: Team[] }>(`/api/public/teams?${params.toString()}`);
        if (active) {
          setTeams(res.teams);
        }
      } catch (err) {
        console.error('Failed to load teams:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadTeams();
    return () => {
      active = false;
    };
  }, [parentZoneId, groupId, searchQuery, lastRealtimeTick]);

  const officialLogosCount = teams.filter((t) => t.hasOfficialLogo).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-nlo-navy text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-emerald-500">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            46 Official NLO Cup Clubs
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Participating Teams Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            All 46 clubs verified from the 18 official NLO Secretariat reference sheets. Teams
            awaiting official club logo uploads display a clearly labeled neutral shield badge.
          </p>
        </div>

        <div className="flex gap-3 text-xs shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase">Total Clubs</span>
            <strong className="text-lg font-mono text-white">{teams.length}</strong>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase">Official Logos</span>
            <strong className="text-lg font-mono text-emerald-400">{officialLogosCount}</strong>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Geopolitical Zone
          </label>
          <select
            value={parentZoneId}
            onChange={(e) => {
              setParentZoneId(e.target.value);
              setGroupId('');
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">All 4 Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Competition Group / Centre
          </label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">All 7 Centres</option>
            {filteredGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">Search Club</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search club name..."
              className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-xs text-slate-800"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setParentZoneId('');
            setGroupId('');
            setSearchQuery('');
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
        >
          <Filter className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="rounded-xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
          Loading official clubs...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {teams.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="group rounded-xl bg-white border border-slate-200 hover:border-emerald-600 p-4 shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <TeamCrest
                    name={team.name}
                    logoUrl={team.logoUrl}
                    hasOfficialLogo={team.hasOfficialLogo}
                    size="md"
                  />
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      team.hasOfficialLogo
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {team.hasOfficialLogo ? 'Official Logo' : 'Neutral Badge'}
                  </span>
                </div>

                <h2 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700">
                  {team.name}
                </h2>
                <p className="text-xs font-semibold text-nlo-navy mt-1">
                  {team.groupName} ({team.groupCode})
                </p>
                <p className="text-[11px] text-slate-500">{team.parentZoneName}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">{team.homeVenueName || 'Assigned Centre'}</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

